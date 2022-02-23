import React, { Component } from 'react';
import Web3 from 'web3';
import DaiToken from '../abis/DaiToken.json';
import DappToken from '../abis/DappToken.json';
import TokenFarm from '../abis/TokenFarm.json';
import Navbar from './Navbar';
import Main from './Main';
import './App.css';

import txflow from '../txflow.png';
import stakenissue from '../stakenissue.png';

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const web3 = window.web3;

    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();

    // Load DaiToken
    const daiTokenData = DaiToken.networks[networkId];
    if (daiTokenData) {
      const daiToken = new web3.eth.Contract(DaiToken.abi, daiTokenData.address);
      this.setState({ daiToken });
      let daiTokenBalance = await daiToken.methods.balanceOf(this.state.account).call();
      this.setState({ daiTokenBalance: daiTokenBalance.toString() });
    } else {
      window.alert('DaiToken contract not deployed to detected network.');
    }

    // Load DappToken
    const dappTokenData = DappToken.networks[networkId];
    if (dappTokenData) {
      const dappToken = new web3.eth.Contract(DappToken.abi, dappTokenData.address);
      this.setState({ dappToken });
      let dappTokenBalance = await dappToken.methods.balanceOf(this.state.account).call();
      this.setState({ dappTokenBalance: dappTokenBalance.toString() });
    } else {
      window.alert('DappToken contract not deployed to detected network.');
    }

    // Load TokenFarm
    const tokenFarmData = TokenFarm.networks[networkId];
    if (tokenFarmData) {
      const tokenFarm = new web3.eth.Contract(TokenFarm.abi, tokenFarmData.address);
      this.setState({ tokenFarm });
      let stakingBalance = await tokenFarm.methods.stakingBalance(this.state.account).call();
      this.setState({ stakingBalance: stakingBalance.toString() });
    } else {
      window.alert('TokenFarm contract not deployed to detected network.');
    }

    this.setState({ loading: false });
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  stakeTokens = amount => {
    this.setState({ loading: true });
    this.state.daiToken.methods
      .approve(this.state.tokenFarm._address, amount)
      .send({ from: this.state.account })
      .on('transactionHash', hash => {
        this.state.tokenFarm.methods
          .stakeTokens(amount)
          // .stakeTokens('0') // require error 발생시키기
          .send({ from: this.state.account })
          // https://sabarada.tistory.com/14
          .on('transactionHash', hash => {
            // tx hash 발행된 상태 -> pending
            this.setState({ loading: false });
          })
          .on('receipt', receipt => {
            // receipt 발행된 상태 -> commit
            console.log(receipt);
            (async () => {
              let stakingBalance = await this.state.tokenFarm.methods.stakingBalance(this.state.account).call();
              this.setState({ stakingBalance: stakingBalance.toString() });

              let daiTokenBalance = await this.state.daiToken.methods.balanceOf(this.state.account).call();
              this.setState({ daiTokenBalance: daiTokenBalance.toString() });
            })();
          })
          .on('error', error => {
            console.log(error);
          });
      });
  };

  unstakeTokens = amount => {
    this.setState({ loading: true });
    this.state.tokenFarm.methods
      .unstakeTokens()
      .send({ from: this.state.account })
      .on('transactionHash', hash => {
        this.setState({ loading: false });
      })
      .on('receipt', receipt => {
        // receipt 발행된 상태 -> commit
        console.log(receipt);
        (async () => {
          let stakingBalance = await this.state.tokenFarm.methods.stakingBalance(this.state.account).call();
          this.setState({ stakingBalance: stakingBalance.toString() });

          let daiTokenBalance = await this.state.daiToken.methods.balanceOf(this.state.account).call();
          this.setState({ daiTokenBalance: daiTokenBalance.toString() });
        })();
      })
      .on('error', error => {
        console.log(error);
      });
  };

  constructor(props) {
    super(props);
    this.state = {
      account: '0x0',
      daiToken: {},
      dappToken: {},
      tokenFarm: {},
      daiTokenBalance: '0',
      dappTokenBalance: '0',
      stakingBalance: '0',
      loading: true,
    };
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <div id="loader" style={{ height: 353, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span>Loading...</span>
        </div>
      );
    } else {
      content = (
        <Main
          daiTokenBalance={this.state.daiTokenBalance}
          dappTokenBalance={this.state.dappTokenBalance}
          stakingBalance={this.state.stakingBalance}
          stakeTokens={this.stakeTokens}
          unstakeTokens={this.unstakeTokens}
        />
      );
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '800px' }}>
              <div className="content mr-auto ml-auto">{content}</div>
              <section>
                <a href="https://www.youtube.com/watch?v=CgXQC4dbGUE&t=5114s" target="_blank" rel="noopener noreferrer">
                  https://www.youtube.com/watch?v=CgXQC4dbGUE&t=5114s
                </a>
                <h3>Stake and Issue Flow</h3>
                <img src={stakenissue} width="100%" />
                <h3>Ethereum Transaction Flow</h3>
                <img src={txflow} width="100%" />
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
