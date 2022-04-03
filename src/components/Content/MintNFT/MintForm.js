import { useState, useContext } from 'react';

import { Select } from 'antd';

import Web3Context from '../../../store/web3-context';
import CollectionContext from '../../../store/collection-context';

const { Option } = Select;
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });


const MintForm = () => {

  // name
  const [enteredName, setEnteredName] = useState('');
  const [nameIsValid, setNameIsValid] = useState(true);

  // used by date
  const [endDate, setEndDate] = useState('');
  const [endDateIsValid, setEndDateIsValid] = useState(true);

  // // origin
  // const [origin, setOrigin] = useState('');
  // const [originIsValid, setOriginIsValid] = useState(true);

  //cold chain
  const [coldChain, setColdChain] = useState(false);
  const [coldChainIsValid, setColdChainIsValid] = useState(true);

  // description
  const [enteredDescription, setEnteredDescription] = useState('');
  const [descriptionIsValid, setDescriptionIsValid] = useState(true);
  // img
  const [capturedFileBuffer, setCapturedFileBuffer] = useState(null);
  const [fileIsValid, setFileIsValid] = useState(true);

  const web3Ctx = useContext(Web3Context);
  const collectionCtx = useContext(CollectionContext);

  const enteredNameHandler = (event) => {
    setEnteredName(event.target.value);
  };

  const endDateHandler = (event) => {
    setEndDate(event.target.value);
  }

  // const coldChainHandler = (value) => {
  //   setColdChain(value);
  // }

  function handleChange(value) {
    console.log(value.value); // { value: "lucy", key: "lucy", label: "Lucy (101)" }
    setColdChain(value.value);
  }

  const enteredDescriptionHandler = (event) => {
    setEnteredDescription(event.target.value);
  };

  const captureFile = (event) => {
    event.preventDefault();

    const file = event.target.files[0];

    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      setCapturedFileBuffer(Buffer(reader.result));
    }
  };

  const submissionHandler = (event) => {
    event.preventDefault();

    enteredName ? setNameIsValid(true) : setNameIsValid(false);
    endDate ? setEndDateIsValid(true) : setEndDateIsValid(false);
    // coldChain ? setColdChainIsValid(true) : setColdChainIsValid(false);
    enteredDescription ? setDescriptionIsValid(true) : setDescriptionIsValid(false);
    capturedFileBuffer ? setFileIsValid(true) : setFileIsValid(false);

    const formIsValid = enteredName && endDate && enteredDescription && capturedFileBuffer;

    // Upload file to IPFS and push to the blockchain
    const mintNFT = async () => {
      // Add file to the IPFS
      const fileAdded = await ipfs.add(capturedFileBuffer);
      if (!fileAdded) {
        console.error('Something went wrong when updloading the file');
        return;
      }

      const metadata = {
        title: "Asset Metadata",
        type: "object",
        properties: {
          name: {
            type: "string",
            description: enteredName
          },
          endDate: {
            type: "string",
            description: endDate
          },
          coldChain: {
            type: "boolean",
            description: coldChain
          },
          description: {
            type: "string",
            description: enteredDescription
          },
          image: {
            type: "string",
            description: fileAdded.path
          }
        }
      };


      // option 1: database
      // update status data
      // axios.post('http://localhost:9000/status', {
      //   "id": fileAdded.path,
      //   "endDate": "2022/4/30",
      //   "coldChain": coldChain
      // }).then(res => {
      //   console.log(res.data)
      //   setNftlist([...nftlist, res.data])
      // }).catch(err => {
      //   console.log(err)
      // })

      // 
      const metadataAdded = await ipfs.add(JSON.stringify(metadata));
      if (!metadataAdded) {
        console.error('Something went wrong when updloading the file');
        return;
      }

      console.log('fileAdded', fileAdded)
      console.log('fileAdded,path', fileAdded.path)
      console.log('metadataAdded', metadataAdded)
      // console.log(`http://localhost:9000/status/${fileAdded.path}`)

      // use safeMint in contract
      collectionCtx.contract.methods.safeMint(metadataAdded.path,fileAdded.path,endDate,coldChain).send({ from: web3Ctx.account })
        .on('transactionHash', (hash) => {
          collectionCtx.setNftIsLoading(true);
        })
        .on('error', (e) => {
          window.alert('Something went wrong when pushing to the blockchain');
          collectionCtx.setNftIsLoading(false);
        })
    };

    formIsValid && mintNFT();
  };

  const nameClass = nameIsValid ? "form-control" : "form-control is-invalid";
  const endDateClass = endDateIsValid ? "form-control" : "form-control is-invalid";
  const coldChainClass = coldChainIsValid ? "form-control" : "form-control is-invalid"
  const descriptionClass = descriptionIsValid ? "form-control" : "form-control is-invalid";
  const fileClass = fileIsValid ? "form-control" : "form-control is-invalid";



  return (
    <form onSubmit={submissionHandler}>
      <div className="row justify-content-center">
        <div className="col-md-2">
          {/* name */}
          <input
            type='text'
            className={`${nameClass} mb-1`}
            placeholder='Name...'
            value={enteredName}
            onChange={enteredNameHandler}
          />
        </div>
        {/* used by date */}
        <div className="col-md-2">
          <input
            type='text'
            className={`${endDateClass} mb-1`}
            placeholder='Used by Date'
            value={endDate}
            onChange={endDateHandler}
          />
        </div>
        {/* cold chain */}
        <div className="col-md-2">
          <Select className={`${coldChainClass} mb-1`}
            labelInValue
            defaultValue={{ value: 'Normal' }}
            style={{ width: 120 }}
            onChange={handleChange}
          >
            <Option value={false}>Normal</Option>
            <Option value={true}>Cold Chain</Option>
          </Select>
        </div>
        {/* description */}
        <div className="col-md-2">
          <input
            type='text'
            className={`${descriptionClass} mb-1`}
            placeholder='Description...'
            value={enteredDescription}
            onChange={enteredDescriptionHandler}
          />
        </div>
        <div className="col-md-2">
          <input
            type='file'
            className={`${fileClass} mb-1`}
            onChange={captureFile}
          />
        </div>
      </div>
      <button type='submit' className='btn btn-lg btn-info text-white btn-block'>MINT</button>
    </form>
  );
};

export default MintForm;