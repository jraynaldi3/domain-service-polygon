import React, {useEffect,useState} from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import {ethers} from "ethers";
import contractAbi from "./utils/Domains.json";
import ethLogo from "./assets/ethlogo.png";
import polygonLogo from "./assets/polygonlogo.png";
import {networks} from "./utils/networks";
import owlLogo from "./favicon.ico";

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = ".pom";
const CONTRACT_ADDRESS = "0xC83Ff01B7e5074DB9990b09e329679f5B0c6D951"


const App = () => {
  const [network, setNetwork] = useState("");
  const [currentAccount,setCurrentAccount] = useState('');
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [loading, setLoading]= useState(false);
  const [editing, setEditing] = useState(false);
  const [mints, setMints] = useState([]);
  
  const checkIfWalletConnected = async()=>{
    const {ethereum} = window;
    if(ethereum){
      console.log("We have the ethereum object");
    } else {
      console.log("Make sure you have Metamask!");
    }

    const accounts = await ethereum.request({method: "eth_accounts"})

    if (accounts.length !== 0 ){
      const account = accounts[0];
      console.log("Found an authorized account:" , account);
      setCurrentAccount(account)
    } else {
      console.log("No authorized account found!");
    }

    const chainId = await ethereum.request({method : "eth_chainId"});
    setNetwork(networks[chainId]);
    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged (_chainId) {
      window.location.reload();
    }
    
  }

  const connectWallet = async()=>{
    try{
      const {ethereum} = window;
      if(!ethereum){
        alert("Get Metamask -> https://metamask.io/")
        return;
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"});

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0])
    } catch(error){
      console.log("Failed to connect wallet", error)
    }
  }

  //the mint button
  const mintDomain = async () =>{
    //Dont run if domain is empty
    if(!domain) {return}
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    //Calculate price
    const price = domain.length ===3 ?"0.5"
      : domain.length ===4 ?"0.3"
      : "0.1";

    console.log("Minting domain", domain, "with price", price);

    try{
      const {ethereum} = window
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let txn = await contract.register(domain, {value: ethers.utils.parseEther(price)});

        const receipt = await txn.wait();

        if (receipt.status === 1 ){
          console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+txn.hash);
          alert("Domain minted! https://mumbai.polygonscan.com/tx/"+txn.hash);

          txn = await contract.setRecord(domain, record);
          await txn.wait();

          console.log("Record set! https://mumbai.polygonscan.com/tx/"+txn.hash);
          alert("Record set! https://mumbai.polygonscan.com/tx/"+txn.hash);

          setTimeout(()=>{
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {alert("transaction failed! Please try again")}
      }
    } catch(error){
      console.log("Failed to mint Domain" , error);
    }
  }

  //switch network button
  const switchNetwork = async()=>{
    if (window.ethereum){
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{chainId: "0x13881"}],
        });
      } catch(error){
        if (error.code === 4920){
          try{
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId : '0x13881',
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]      
                }
              ]
            });
          } catch(error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    }else{
      alert("Metamask is not installed. Please install it to use this app: https://metamask.io/download.html");
    }
  }
  
  const renderNotConnectedContainer = () =>(
    <div className="connect-wallet-container">
      <img src="https://media.giphy.com/media/s68CylvQ9ioRa/giphy.gif" 
        alt="Owl gif" />
      <button className="cta-button connect-wallet-button" onClick={connectWallet}>
        Connect Wallet
      </button>
    </div>
  )

  //update Domain
  const updateDomain = async()=>{
    if (!record || !domain) {return};
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const {ethereum} = window;
      if (ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS,contractAbi.abi, signer)

        let tx = await contract.setRecord(domain,record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);

        fetchMints();
        setRecord('');
        setDomain('');
      } else {
        console.log("please install Metamask");
      }
    } catch(error) {
      console.log(error);
    }
    setLoading(false);
  }

  //fetch mints
  const fetchMints = async()=>{
    try {
      const {ethereum} = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

        //get all the domain names
        const names = await contract.getAllNames();

        //for each name, get record and the address
        const mintRecords = await Promise.all(names.map(async(name)=>{
          const mintRecord = await contract.getRecord(name);
          const owner = await contract.getAddress(name);
          return {
            id: names.indexOf(name),
            name: name,
            record: mintRecord,
            owner: owner
          }
        }))
        console.log("Mints Fetched", mintRecords);
        setMints(mintRecords);
      } else {
        console.log("Please download Metamask")
      }
    } catch(error){
      console.log("Failed to fetch" , error)
    }
  }

  const editRecord = (name) =>{
    console.log('Editing record for', name);
    setEditing(true);
    setDomain(name);
  }

  //form to enter domain name and data
  const renderInputForm = () =>{
    if (network !== "Polygon Mumbai Testnet"){
      return(
        <div className="connect-wallet-container">
          <h2>Please Change Network to Mumbai </h2>
          <button className="cta-button mint-button" onClick={switchNetwork}>
            Click here to switch Network
          </button>
        </div>
      )
    }
    return (
      <div className="form-container">
        <div className="first-row">
          <input 
            type="text"
            value={domain}
            placeholder='domain'
            onChange={e=> setDomain(e.target.value)}
          />
          <p className='tld'> {tld} </p>
        </div>

        <input 
          type="text"
          value={record}
          placeholder="Whats pom meaning to you"
          onChange={e=>setRecord(e.target.value)}
        />
        {editing ?(
         <div className="button-container">
           <button className="cta-button mint-button" disabled={loading} onClick={updateDomain}>
            Set Record
          </button>
           <button className="cta-button mint-button" onClick={()=>{setEditing(false);
                                                                   setDomain('')}}>
            Cancel
          </button>
         </div>
        ) : (
        <button className="cta-button mint-button" disabled={null} onClick={mintDomain}>
            Mint
          </button>
        )}
        </div>             
    )
  }

  const renderMints = ()=>{
    if (currentAccount && mints.length >0){
      return (
        <div className = "mint-container">
          <p className="subtitle"> Recently minted domains!</p>
          <div className="mint-list">
            {mints.map((mint, index)=>{
              return(
                <div className="mint-item" key = {index}>
                  <div className="mint-row">
                    <a 
                      className="link" 
                      href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                      target="_blank"
                      rel="noopener noreferrer">
                      <p className="underlined"> {' '}{mint.name}{' '}</p>
                    </a>
                    {mint.owner.toLowerCase()===currentAccount.toLowerCase()?
                    <button className="edit-button" onClick={()=> editRecord(mint.name)}>
                      <img className="edit-icon" 
                        src="https://img.icons8.com/metro/26/000000/pencil.png"
                        alt="Edit button" />
                    </button>: null}
                  </div>
                  <p> {mint.record} </p>
                </div>
                )
            })}
          </div>
        </div>);
    }
  };

  useEffect(()=>{
    console.log("network",network)
    if (network === "Polygon Mumbai Testnet"){
      fetchMints();
    } else {
      console.log("Cannot Fetch, Wrong Network");
    }
  },[currentAccount, network])
  
  useEffect(()=>{
    checkIfWalletConnected();
  },[])

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <div>
                <img src={owlLogo} />
                <p className="title"> Pom Name Service</p>
              </div>
              <p className="subtitle">Your immortal API on the blockchain!</p>
              
            </div>
            <div className="right">
                <img alt="Network Logo" className="logo" 
                  src={ network.includes('Polygon')? polygonLogo: ethLogo}/>
                
                  {currentAccount?
                  <p>Wallet : {currentAccount.slice(0,6)}...{currentAccount.slice(-4)}</p> : <p> Not Connected </p>
                  }
              </div>
					</header>
				</div>

        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}
        

        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
