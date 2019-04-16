docker rm -f $(docker ps -aq)
docker volume rm $(docker volume ls -q)
docker system prune -f

cd ~/fabric-samples/first-network
sudo rm -r channel-artifacts && rm -r crypto-config
mkdir channel-artifacts
export FABRIC_CFG_PATH=$PWD
cryptogen generate --config=./crypto-config.yaml

cp docker-compose-e2e-template.yaml docker-compose-e2e.yaml

export CURRENT_DIR=$PWD
cd crypto-config/peerOrganizations/vw.abosalah.com/ca/
export PRIV_KEY=$(ls *_sk)
echo $PRIV_KEY
cd "$CURRENT_DIR"
sed -i "s/CA1_PRIVATE_KEY/${PRIV_KEY}/g" docker-compose-e2e.yaml

cd crypto-config/peerOrganizations/bmw.abosalah.com/ca/
export PRIV_KEY=$(ls *_sk)
echo $PRIV_KEY
cd "$CURRENT_DIR"
sed -i "s/CA2_PRIVATE_KEY/${PRIV_KEY}/g" docker-compose-e2e.yaml

cd crypto-config/peerOrganizations/mb.abosalah.com/ca/
export PRIV_KEY=$(ls *_sk)
echo $PRIV_KEY
cd "$CURRENT_DIR"
sed -i "s/CA3_PRIVATE_KEY/${PRIV_KEY}/g" docker-compose-e2e.yaml

cd ~/fabric-samples/first-network
export FABRIC_CFG_PATH=$PWD
configtxgen -profile ThreeOrgsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block

configtxgen -profile ThreeOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID actionchannel

configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/VWMSPanchors.tx -channelID actionchannel -asOrg VWMSP
configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/BMWMSPanchors.tx -channelID actionchannel -asOrg BMWMSP
configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/MBMSPanchors.tx -channelID actionchannel -asOrg MBMSP

configtxlator proto_decode --type=common.Block --input=./channel-artifacts/genesis.block --output=./channel-artifacts/genesis.json

cd ~/fabric-samples/first-network
docker-compose -f docker-compose-cli.yaml up -d

docker exec -it cli bash

peer channel create -o orderer.abosalah.com:7050 -c actionchannel -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/abosalah.com/orderers/orderer.abosalah.com/msp/tlscacerts/tlsca.abosalah.com-cert.pem

peer channel join -b actionchannel.block

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bmw.abosalah.com/users/Admin@bmw.abosalah.com/msp   CORE_PEER_ADDRESS=peer0.bmw.abosalah.com:9051 CORE_PEER_LOCALMSPID="BMWMSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bmw.abosalah.com/peers/peer0.bmw.abosalah.com/tls/ca.crt peer channel join -b actionchannel.block

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bmw.abosalah.com/users/Admin@bmw.abosalah.com/msp CORE_PEER_ADDRESS=peer0.bmw.abosalah.com:9051 CORE_PEER_LOCALMSPID="BMWMSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bmw.abosalah.com/peers/peer0.bmw.abosalah.com/tls/ca.crt peer channel list

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mb.abosalah.com/users/Admin@mb.abosalah.com/msp CORE_PEER_ADDRESS=peer0.mb.abosalah.com:11051 CORE_PEER_LOCALMSPID="MBMSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mb.abosalah.com/peers/peer0.mb.abosalah.com/tls/ca.crt peer channel join -b actionchannel.block

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mb.abosalah.com/users/Admin@mb.abosalah.com/msp CORE_PEER_ADDRESS=peer0.mb.abosalah.com:11051 CORE_PEER_LOCALMSPID="MBMSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mb.abosalah.com/peers/peer0.mb.abosalah.com/tls/ca.crt peer channel list

peer channel update -o orderer.abosalah.com:7050 -c actionchannel -f ./channel-artifacts/VWMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/abosalah.com/orderers/orderer.abosalah.com/msp/tlscacerts/tlsca.abosalah.com-cert.pem

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bmw.abosalah.com/users/Admin@bmw.abosalah.com/msp CORE_PEER_ADDRESS=peer0.bmw.abosalah.com:9051 CORE_PEER_LOCALMSPID="BMWMSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bmw.abosalah.com/peers/peer0.bmw.abosalah.com/tls/ca.crt peer channel update -o orderer.abosalah.com:7050 -c actionchannel -f ./channel-artifacts/BMWMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/abosalah.com/orderers/orderer.abosalah.com/msp/tlscacerts/tlsca.abosalah.com-cert.pem

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mb.abosalah.com/users/Admin@mb.abosalah.com/msp CORE_PEER_ADDRESS=peer0.mb.abosalah.com:11051 CORE_PEER_LOCALMSPID="MBMSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mb.abosalah.com/peers/peer0.mb.abosalah.com/tls/ca.crt peer channel update -o orderer.abosalah.com:7050 -c actionchannel -f ./channel-artifacts/MBMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/abosalah.com/orderers/orderer.abosalah.com/msp/tlscacerts/tlsca.abosalah.com-cert.pem







