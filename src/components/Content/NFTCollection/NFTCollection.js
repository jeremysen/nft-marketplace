import { useContext, useRef, createRef,useState } from 'react';
// import useState from 'react-usestateref'
// import axios from 'axios';
import { Card, Select } from 'antd';
import web3 from '../../../connection/web3';
import Web3Context from '../../../store/web3-context';
import CollectionContext from '../../../store/collection-context';
import MarketplaceContext from '../../../store/marketplace-context';
import { formatPrice } from '../../../helpers/utils';
import eth from '../../../img/eth.png';

const {Option}=Select


const NFTCollection = () => {
  const web3Ctx = useContext(Web3Context);
  const collectionCtx = useContext(CollectionContext);
  const marketplaceCtx = useContext(MarketplaceContext);

  const [clist, setClist] = useState()
  const [loading, setLoading] = useState(false);
  // axios.get(`http://localhost:9000/status`).then(res=>{
  //   setNftStatus(res.data)
  // })

  // console.log("ctx",collectionCtx)

  const priceRefs = useRef([]);
  if (priceRefs.current.length !== collectionCtx.collection.length) {
    priceRefs.current = Array(collectionCtx.collection.length).fill().map((_, i) => priceRefs.current[i] || createRef());
  }

  const makeOfferHandler = (event, id, key) => {
    event.preventDefault();

    const enteredPrice = web3.utils.toWei(priceRefs.current[key].current.value, 'ether');

    collectionCtx.contract.methods.approve(marketplaceCtx.contract.options.address, id).send({ from: web3Ctx.account })
      .on('transactionHash', (hash) => {
        marketplaceCtx.setMktIsLoading(true);
      })
      .on('receipt', (receipt) => {
        marketplaceCtx.contract.methods.makeOffer(id, enteredPrice).send({ from: web3Ctx.account })
          .on('error', (error) => {
            window.alert('Something went wrong when pushing to the blockchain');
            marketplaceCtx.setMktIsLoading(false);
          });
      });
    // console.log("ctx",collectionCtx);
  };

  const buyHandler = (event) => {
    const buyIndex = parseInt(event.target.value);
    marketplaceCtx.contract.methods.fillOffer(marketplaceCtx.offers[buyIndex].offerId).send({ from: web3Ctx.account, value: marketplaceCtx.offers[buyIndex].price })
      .on('transactionHash', (hash) => {
        marketplaceCtx.setMktIsLoading(true);
      })
      .on('error', (error) => {
        window.alert('Something went wrong when pushing to the blockchain');
        marketplaceCtx.setMktIsLoading(false);
      });
  };

  const cancelHandler = (event) => {
    const cancelIndex = parseInt(event.target.value);
    marketplaceCtx.contract.methods.cancelOffer(marketplaceCtx.offers[cancelIndex].offerId).send({ from: web3Ctx.account })
      .on('transactionHash', (hash) => {
        marketplaceCtx.setMktIsLoading(true);
      })
      .on('error', (error) => {
        window.alert('Something went wrong when pushing to the blockchain');
        marketplaceCtx.setMktIsLoading(false);
      });
  };

  const changeColdChain = (_account, _id,c) => {
    // setLoading(true);
    collectionCtx.contract.methods
      .updateColdChain(_id,c)
      .send({
        from: _account,
      })
      .once("error", (err) => {
        setLoading(false);
        console.log(err);
      })
      .then((receipt) => {
        setLoading(false);
        console.log(receipt);
      });
  };

  const handleChange = (value, id,_account) => {
    let c=value=="normal"?false:true;
    console.log('radio checked', c);
    console.log('id',typeof id);

    changeColdChain(_account,parseInt(id), c);
    setTimeout(() => {
      const list=[...clist]
      setClist(list.map(item=>{
        console.log("itemid",item)
        console.log("itemid",item.id==id)
        if(item.id==id){
          console.log("co",item.coldChain)
          return {
            ...item,
            coldChain:c
          }
          // const newitem={...item,coldChain:coldChain}
          // console.log("newitem",newitem)
          // return newitem;
        }
        return item
      }))
    }, 1000);
    // setClist([...clist])
    console.log(clist)
    // console.log('ctx', collectionCtx)
  };

  const cons = collectionCtx.contract.methods.getCons().call();
  cons.then(result => {
    // setClist(result);
    const list=result.map(item=>{
      return {
        id: item.id,
        URI: item.URI,
        img: item.img,
        USD: item.USD,
        coldChain: item.coldChain
      }
    })

    // console.log('list', list)
    setClist(list)
  });
  return (
    <div className="row text-center">
      {
        collectionCtx.collection.map((NFT, key) => {
          const index = marketplaceCtx.offers ? marketplaceCtx.offers.findIndex(offer => offer.id === NFT.id) : -1;
          const owner = index === -1 ? NFT.owner : marketplaceCtx.offers[index].user;
          const price = index !== -1 ? formatPrice(marketplaceCtx.offers[index].price).toFixed(2) : null;


          // option 1: use id
          // const status = nftStatus.filter(item => item.id===NFT.img)

          let item = clist.find(item => item.img == NFT.img);
          // console.log("128",NFT.img)
          // console.log("128",item)
          let id = item ? item.id : -1;
          let USD = item ? item.USD : null;
          let cold = item ? item.coldChain : false;


          if (id != -1) {
            return (
              <div key={key} className="col-md-2 m-3 pb-3 card border-info">
                <img src={`https://ipfs.infura.io/ipfs/${NFT.img}`} className="card-img-bottom" alt={`NFT ${key}`} />
                <Card size="small" title={NFT.title}>
                  <p>description:{NFT.description}</p>
                  <p>Used by Date:{USD}</p>
                  <p>Cold Chain:{cold ? "true" : "false"}</p>
                </Card>
                {/* <div className={"card-body"}>
                  <h5 className="card-title" align="left">{NFT.title}</h5>
                  <h6 className="card-description" align="left">{NFT.description}</h6>
                  <h6 align="left">Used by Date:{USD}</h6>
                  <h6 align="left">Cold Chain:{cold ? "true" : "false"}</h6>
                </div> */}
                <p className="fw-light fs-6">{`${NFT.img.substr(0, 7)}...${NFT.img.substr(owner.length - 7)}`}</p>
                {index !== -1 ?
                  owner !== web3Ctx.account ?
                    <div className="row">
                      <div className="d-grid gap-2 col-5 mx-auto">
                        <button onClick={buyHandler} value={index} className="btn btn-success">BUY</button>
                      </div>
                      <div className="col-7 d-flex justify-content-end">
                        <img src={eth} width="25" height="25" className="align-center float-start" alt="price icon"></img>
                        <p className="text-start"><b>{`${price}`}</b></p>
                      </div>
                    </div> :
                    <div className="row">
                      <div className="d-grid gap-2 col-5 mx-auto">
                        <button onClick={cancelHandler} value={index} className="btn btn-danger">CANCEL</button>
                      </div>
                      <div className="col-7 d-flex justify-content-end">
                        <img src={eth} width="25" height="25" className="align-center float-start" alt="price icon"></img>
                        <p className="text-start"><b>{`${price}`}</b></p>
                      </div>
                    </div> :
                  owner === web3Ctx.account ?
                    <form className="row g-2" onSubmit={(e) => makeOfferHandler(e, NFT.id, key)}>
                      <div className="col-5 d-grid gap-2">
                        <button type="submit" className="btn btn-secondary">OFFER</button>
                      </div>
                      <div className="col-7">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="ETH..."
                          className="form-control"
                          ref={priceRefs.current[key]}
                        />
                      </div>
                      <div className="row g-2">
                        <Select defaultValue={cold ? "cold chain" : "normal"}  onChange={(value)=>handleChange(value,id,NFT.owner)}>
                          <Option value="cold chain">cold chain</Option>
                          <Option value="normal">normal</Option>
                        </Select>
                      </div>
                    </form> :
                    <p><br /></p>}
              </div>
            );//end return
          }
        })}
    </div>
  );
};

export default NFTCollection;