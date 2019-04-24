/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

// predefined patent states
const patentStatus = {
    New: { code: 1, text: 'Patent Created' },
    Rejected: { code: 2, text: 'Patent Rejected' },
    Verified: { code: 3, text: 'Patent Verified' },
    Published: { code: 4, text: 'Patent Published' },
};

// Patent Contract contract
class PatentContract extends Contract {

    // instantiate with keys to collect participant ids
    async instantiate(ctx) {

        let ownerList = [];
        await ctx.stub.putState('owners', Buffer.from(JSON.stringify(ownerList)));

        let verifierList = [];
        await ctx.stub.putState('verifiers', Buffer.from(JSON.stringify(verifierList)));

        let publisherList = [];
        await ctx.stub.putState('publishers', Buffer.from(JSON.stringify(publisherList)));

        let patentList = [];
        await ctx.stub.putState('patents', Buffer.from(JSON.stringify(patentList)));
    }

    // add a owner object to the blockchain state identifited by the ownerId
    async RegisterOwner(ctx, ownerId, name) {

        let owner = {
            id: ownerId,
            name: name,
            type: 'Owner',
            patents: []
        };
        await ctx.stub.putState(ownerId, Buffer.from(JSON.stringify(owner)));

        //add ownerId to 'owners' key
        let data = await ctx.stub.getState('owners');
        if (data) {
            let owners = JSON.parse(data.toString());
            owners.push(ownerId);
            await ctx.stub.putState('owners', Buffer.from(JSON.stringify(owners)));
        } else {
            throw new Error('owners not found');
        }

        // return owner object
        return JSON.stringify(owner);
    }

    // add a verifier object to the blockchain state identifited by the verifierId
    async RegisterVerifier(ctx, verifierId, name) {

        let verifier = {
            id: verifierId,
            name: name,
            type: 'Verifier',
            patents: []
        };
        await ctx.stub.putState(verifierId, Buffer.from(JSON.stringify(verifier)));

        // add verifierId to 'verifiers' key
        let data = await ctx.stub.getState('verifiers');
        if (data) {
            let verifiers = JSON.parse(data.toString());
            verifiers.push(verifierId);
            await ctx.stub.putState('verifiers', Buffer.from(JSON.stringify(verifiers)));
        } else {
            throw new Error('verifiers not found');
        }

        // return seller object
        return JSON.stringify(verifier);
    }

    // add a publisher object to the blockchain state identifited by the publisherId
    async RegisterPublisher(ctx, publisherId, name) {

        let publisher = {
            id: publisherId,
            name: name,
            type: 'Publisher',
            patents: []
        };
        await ctx.stub.putState(publisherId, Buffer.from(JSON.stringify(publisher)));

        // add publisherId to 'publishers' key
        let data = await ctx.stub.getState('publishers');
        if (data) {
            let publishers = JSON.parse(data.toString());
            publishers.push(publisherId);
            await ctx.stub.putState('publishers', Buffer.from(JSON.stringify(publishers)));
        } else {
            throw new Error('publishers not found');
        }

        // return publisher object
        return JSON.stringify(publisher);
    }

    // add an patent object to the blockchain state identifited by the patentId
    async CreatePatent(ctx, patentId, industry, ownersList,
        details, verifierId, publisherId) {

        var ownersListSplitted = ownersList.split(",");

        // verify ownerId
        for (const ownerId of ownersListSplitted) {
            let ownerData = ctx.stub.getState(ownerId);
            let owner;
            if (ownerData) {
                owner = JSON.parse(ownerData.toString());
                if (owner.type !== 'Owner') {
                    throw new Error('owner not identified');
                }
            } else {
                throw new Error('owner not found');
            }
        }

        // verify verifierId
        let verifierData = await ctx.stub.getState(verifierId);
        let verifier;
        if (verifierData) {
            verifier = JSON.parse(verifierData.toString());
            if (verifier.type !== 'Verifier') {
                throw new Error('verifier not identified');
            }
        } else {
            throw new Error('verifier not found');
        }

        // verify publisherId
        let publisherData = await ctx.stub.getState(publisherId);
        let publisher;
        if (publisherData) {
            publisher = JSON.parse(publisherData.toString());
            if (publisher.type !== 'Publisher') {
                throw new Error('publisher not identified');
            }
        } else {
            throw new Error('publisher not found');
        }

        let patent = {
            id: patentId,
            industry: industry,
            status: JSON.stringify(patentStatus.New),
            ownersList: ownersList,
            details: details,
            verifierId: verifierId,
            publisherId: publisherId
        };

        //add patent to owner
        for (const ownerId of ownersListSplitted) {
            let ownerData = ctx.stub.getState(ownerId);
            let owner;
            if (ownerData) {
                owner = JSON.parse(ownerData.toString());
                owner.patents.push(patentId);
                if (owner.patents == "") {
                    owner.patents = patentId
                } else {
                    owner.patents = owner.patents.concat(",", patentId)
                }
                ctx.stub.putState(owner.id, Buffer.from(JSON.stringify(owner)));
            }

        }


        //add patent to verifier
        if (verifier.patents == "") {
            verifier.patents = patentId
        } else {
            verifier.patents = verifier.patents.concat(",", patentId)
        }
        await ctx.stub.putState(verifierId, Buffer.from(JSON.stringify(verifier)));

        //add patent to publisher
        if (publisher.patents == "") {
            publisher.patents = patentId
        } else {
            publisher.patents = publisher.patents.concat(",", patentId)
        }
        await ctx.stub.putState(publisherId, Buffer.from(JSON.stringify(publisher)));

        //store patent identified by patentId
        await ctx.stub.putState(patentId, Buffer.from(JSON.stringify(patent)));

        // return patent object
        return JSON.stringify(patent);
    }

    async verifyPatent(ctx, patentId, ownerId, verifierId) {

        // get patent json
        let data = await ctx.stub.getState(patentId);
        let patent;
        if (data) {
            patent = JSON.parse(data.toString());
        } else {
            throw new Error('patent not found');
        }

        // verify ownerId
        let ownerData = await ctx.stub.getState(ownerId);
        let owner;
        if (ownerData) {
            owner = JSON.parse(ownerData.toString());
            if (owner.type !== 'Owner') {
                throw new Error('owner not identified');
            }
        } else {
            throw new Error('owner not found');
        }

        // verify verifierId
        let verifierData = await ctx.stub.getState(verifierId);
        let verifier;
        if (verifierData) {
            verifier = JSON.parse(verifierData.toString());
            if (verifier.type !== 'Verifier') {
                throw new Error('verifier not identified');
            }
        } else {
            throw new Error('verifier not found');
        }

        // update patent status
        if (patent.status == JSON.stringify(patentStatus.Created)) {
            patent.status = JSON.stringify(patentStatus.Bought);
            await ctx.stub.putState(patentId, Buffer.from(JSON.stringify(order)));

            //add patent to verifier
            if (verifier.patents == "") {
                verifier.patents = patentId
            } else {
                verifier.patents = verifier.patents.concat(",", patentId)
            }
            await ctx.stub.putState(verifierId, Buffer.from(JSON.stringify(verifier)));

            return JSON.stringify(patent);
        } else {
            throw new Error('patent not created');
        }
    }


    async OrderCancel(ctx, orderNumber, sellerId, buyerId) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify buyerId
        let buyerData = await ctx.stub.getState(buyerId);
        let buyer;
        if (buyerData) {
            buyer = JSON.parse(buyerData.toString());
            if (buyer.type !== 'buyer') {
                throw new Error('buyer not identified');
            }
        } else {
            throw new Error('buyer not found');
        }

        // verify sellerId
        let sellerData = await ctx.stub.getState(sellerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        //update order
        if (order.status == JSON.stringify(patentStatus.Created) || order.status == JSON.stringify(patentStatus.Bought) || order.status == JSON.stringify(patentStatus.Backordered)) {
            order.status = JSON.stringify(patentStatus.Reject);
            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
            return JSON.stringify(order);
        } else {
            throw new Error('order not created, bought or backordered');
        }
    }


    async OrderFromSupplier(ctx, orderNumber, sellerId, providerId) {

        //get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        //verify sellerId
        let sellerData = await ctx.stub.getState(sellerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        // verify providerId
        let providerData = await ctx.stub.getState(providerId);
        let provider;
        if (providerData) {
            provider = JSON.parse(providerData.toString());
            if (provider.type !== 'provider') {
                throw new Error('provider not identified');
            }
        } else {
            throw new Error('provider not found');
        }

        //update order
        if (order.status == JSON.stringify(patentStatus.Bought)) {
            order.providerId = providerId;
            order.status = JSON.stringify(patentStatus.Ordered);
            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));

            // add order to provider
            provider.orders.push(orderNumber);
            await ctx.stub.putState(providerId, Buffer.from(JSON.stringify(provider)));

            return JSON.stringify(order);
        } else {
            throw new Error('order status not bought');
        }
    }

    async RequestShipping(ctx, orderNumber, providerId, shipperId) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify providerId
        let providerData = await ctx.stub.getState(providerId);
        let provider;
        if (providerData) {
            provider = JSON.parse(providerData.toString());
            if (provider.type !== 'provider') {
                throw new Error('provider not identified');
            }
        } else {
            throw new Error('provider not found');
        }

        // verify shipperId
        let shipperData = await ctx.stub.getState(shipperId);
        let shipper;
        if (shipperData) {
            shipper = JSON.parse(shipperData.toString());
            if (shipper.type !== 'shipper') {
                throw new Error('shipper not identified');
            }
        } else {
            throw new Error('shipper not found');
        }

        // update order
        if (order.status == JSON.stringify(patentStatus.Ordered) || order.status == JSON.stringify(patentStatus.Backordered)) {

            order.shipperId = shipperId;
            order.status = JSON.stringify(patentStatus.ShipRequest);
            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));

            // add order to shipper
            shipper.orders.push(orderNumber);
            await ctx.stub.putState(shipperId, Buffer.from(JSON.stringify(shipper)));

            return JSON.stringify(order);

        } else {
            throw new Error('order status not ordered or backordered');
        }
    }

    async Delivering(ctx, orderNumber, shipperId, deliveryStatus) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify shipperId
        let shipperData = await ctx.stub.getState(shipperId);
        let shipper;
        if (shipperData) {
            shipper = JSON.parse(shipperData.toString());
            if (shipper.type !== 'shipper') {
                throw new Error('shipper not identified');
            }
        } else {
            throw new Error('shipper not found');
        }

        // update order
        if (order.status == JSON.stringify(patentStatus.ShipRequest) || order.status.code == JSON.stringify(patentStatus.Delivering.code)) {

            let _status = patentStatus.Delivering;
            _status.text += '  ' + deliveryStatus;
            order.status = JSON.stringify(_status);

            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
            return JSON.stringify(order);
        } else {
            throw new Error('order status not shipping requested or delivering');
        }
    }


    async Deliver(ctx, orderNumber, shipperId) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify shipperId
        let shipperData = await ctx.stub.getState(shipperId);
        let shipper;
        if (shipperData) {
            shipper = JSON.parse(shipperData.toString());
            if (shipper.type !== 'shipper') {
                throw new Error('shipper not identified');
            }
        } else {
            throw new Error('shipper not found');
        }

        // update order
        if (order.status == JSON.stringify(patentStatus.ShipRequest) || (JSON.parse(order.status).code == JSON.stringify(patentStatus.Delivering.code))) {

            order.status = JSON.stringify(patentStatus.Delivered);
            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
            return JSON.stringify(order);
        } else {
            throw new Error('order status not shipping requested or delivering');
        }
    }

    async RequestPayment(ctx, orderNumber, sellerId, financeCoId) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify sellerId
        let sellerData = await ctx.stub.getState(sellerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        // verify financeCoId
        let financeCoData = await ctx.stub.getState(financeCoId);
        let financeCo;
        if (financeCoData) {
            financeCo = JSON.parse(financeCoData.toString());
            if (financeCo.type !== 'financeCo') {
                throw new Error('financeCo not identified');
            }
        } else {
            throw new Error('financeCo not found');
        }

        // update order
        if ((JSON.parse(order.status).text == patentStatus.Delivered.text) || (JSON.parse(order.status).text == patentStatus.Resolve.text)) {

            order.status = JSON.stringify(patentStatus.PayRequest);

            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
            return JSON.stringify(order);
        } else {
            throw new Error('order status not delivered or resolved');
        }
    }


    async AuthorizePayment(ctx, orderNumber, buyerId, financeCoId) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify buyerId
        let buyerData = await ctx.stub.getState(buyerId);
        let buyer;
        if (buyerData) {
            buyer = JSON.parse(buyerData.toString());
            if (buyer.type !== 'buyer') {
                throw new Error('buyer not identified');
            }
        } else {
            throw new Error('buyer not found');
        }

        // verify financeCoId
        let financeCoData = await ctx.stub.getState(financeCoId);
        let financeCo;
        if (financeCoData) {
            financeCo = JSON.parse(financeCoData.toString());
            if (financeCo.type !== 'financeCo') {
                throw new Error('financeCo not identified');
            }
        } else {
            throw new Error('financeCo not found');
        }

        //update order
        if ((JSON.parse(order.status).text == patentStatus.PayRequest.text) || (JSON.parse(order.status).text == patentStatus.Resolve.text)) {

            order.status = JSON.stringify(patentStatus.Authorize);

            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
            return JSON.stringify(order);
        } else {
            throw new Error('order status not payment requested or resolved');
        }
    }

    async Pay(ctx, orderNumber, sellerId, financeCoId) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify sellerId
        let sellerData = await ctx.stub.getState(sellerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        // verify financeCoId
        let financeCoData = await ctx.stub.getState(financeCoId);
        let financeCo;
        if (financeCoData) {
            financeCo = JSON.parse(financeCoData.toString());
            if (financeCo.type !== 'financeCo') {
                throw new Error('financeCo not identified');
            }
        } else {
            throw new Error('financeCo not found');
        }

        // update order
        if (JSON.parse(order.status).text == patentStatus.Authorize.text) {

            order.status = JSON.stringify(patentStatus.Paid);

            await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
            return JSON.stringify(order);
        } else {
            throw new Error('order status not authorize payment');
        }
    }

    async Dispute(ctx, orderNumber, buyerId, sellerId, financeCoId, dispute) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify sellerId
        let sellerData = await ctx.stub.getState(sellerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        // verify financeCoId
        let financeCoData = await ctx.stub.getState(financeCoId);
        let financeCo;
        if (financeCoData) {
            financeCo = JSON.parse(financeCoData.toString());
            if (financeCo.type !== 'financeCo') {
                throw new Error('financeCo not identified');
            }
        } else {
            throw new Error('financeCo not found');
        }

        // verify buyerId
        let buyerData = await ctx.stub.getState(buyerId);
        let buyer;
        if (buyerData) {
            buyer = JSON.parse(buyerData.toString());
            if (buyer.type !== 'buyer') {
                throw new Error('buyer not identified');
            }
        } else {
            throw new Error('buyer not found');
        }

        //update order
        order.status = JSON.stringify(patentStatus.Dispute);
        order.dispute = dispute;
        await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
        return JSON.stringify(order);

    }

    async Resolve(ctx, orderNumber, buyerId, sellerId, shipperId, providerId, financeCoId, resolve) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify buyerId
        let buyerData = await ctx.stub.getState(buyerId);
        let buyer;
        if (buyerData) {
            buyer = JSON.parse(buyerData.toString());
            if (buyer.type !== 'buyer') {
                throw new Error('buyer not identified');
            }
        } else {
            throw new Error('buyer not found');
        }

        // verify sellerId
        let sellerData = await ctx.stub.getState(sellerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        // verify shipperId
        let shipperData = await ctx.stub.getState(shipperId);
        let shipper;
        if (shipperData) {
            shipper = JSON.parse(shipperData.toString());
            if (shipper.type !== 'shipper') {
                throw new Error('shipper not identified');
            }
        } else {
            throw new Error('shipper not found');
        }

        // verify providerId
        let providerData = await ctx.stub.getState(providerId);
        let provider;
        if (providerData) {
            provider = JSON.parse(providerData.toString());
            if (provider.type !== 'provider') {
                throw new Error('provider not identified');
            }
        } else {
            throw new Error('provider not found');
        }

        // verify financeCoId
        let financeCoData = await ctx.stub.getState(financeCoId);
        let financeCo;
        if (financeCoData) {
            financeCo = JSON.parse(financeCoData.toString());
            if (financeCo.type !== 'financeCo') {
                throw new Error('financeCo not identified');
            }
        } else {
            throw new Error('financeCo not found');
        }

        // update order
        order.status = JSON.stringify(patentStatus.Resolve);
        order.resolve = resolve;
        await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
        return JSON.stringify(order);

    }


    async Refund(ctx, orderNumber, sellerId, financeCoId, refund) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify sellerId
        let sellerData = await ctx.stub.getState(sellerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        // verify financeCoId
        let financeCoData = await ctx.stub.getState(financeCoId);
        let financeCo;
        if (financeCoData) {
            financeCo = JSON.parse(financeCoData.toString());
            if (financeCo.type !== 'financeCo') {
                throw new Error('financeCo not identified');
            }
        } else {
            throw new Error('financeCo not found');
        }

        order.status = JSON.stringify(patentStatus.Refund);
        order.refund = refund;

        await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
        return JSON.stringify(order);
    }


    async BackOrder(ctx, orderNumber, providerId, backorder) {

        // get order json
        let data = await ctx.stub.getState(orderNumber);
        let order;
        if (data) {
            order = JSON.parse(data.toString());
        } else {
            throw new Error('order not found');
        }

        // verify providerId
        let providerData = await ctx.stub.getState(providerId);
        let provider = JSON.parse(providerData.toString());
        if (provider.type !== 'provider' || order.providerId !== providerId) {
            throw new Error('provider not identified');
        }

        // update order
        order.status = JSON.stringify(patentStatus.Backordered);
        order.backOrder = backorder;
        await ctx.stub.putState(orderNumber, Buffer.from(JSON.stringify(order)));
        return JSON.stringify(order);
    }

    // get the state from key
    async GetState(ctx, key) {
        let data = await ctx.stub.getState(key);
        let jsonData = JSON.parse(data.toString());
        return JSON.stringify(jsonData);
    }

}

module.exports = PatentContract;