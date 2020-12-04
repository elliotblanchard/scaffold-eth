import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
//import 'antd/dist/antd.css'
import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Row, Col, List, Typography, Spin, Card, Radio, Form, Button, Input, InputNumber, notification, Divider } from "antd";
import { Faucet, Balance, Blockie, AddressInput } from "../components";
import { parseEther, parseUnits, formatEther, formatUnits } from "@ethersproject/units";
import { usePoller } from "eth-hooks";
import { TokenBalance } from "."
import { Transactor } from "../helpers";
const { Text, Title, Paragraph } = Typography;

function Erc20Demo({address, selectedProvider, localContracts, networks, network, mainnetProvider}) {

  const [addressInfoForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  let defaultUpdateFunction = 'transfer'
  const [updateFormFunction, setUpdateFormFunction] = useState(defaultUpdateFunction)

  const [decimals, setDecimals] = useState()
  const [totalSupply, setTotalSupply] = useState()
  const [myBalance, setMyBalance] = useState()
  const [addressBalance, setAddressBalance] = useState()
  const [addressAllowance, setAddressAllowance] = useState()

  let contractOptions = localContracts?Object.keys(localContracts):[]
  const [selectedContract, setSelectedContract] = useState()

  const makeCall = async (callName, contract, args) => {
    if(contract[callName]) {
      let result
      if(args) {
        result = await contract[callName](...args)
      } else {
        result = await contract[callName]()
      }
      return result
    }
  }

  const getErc20Info = async () => {
    if(selectedContract) {
      let _totalSupply = await makeCall('totalSupply', localContracts[selectedContract])
      let _decimals = await makeCall('decimals', localContracts[selectedContract])
      let _balanceOf = await makeCall('balanceOf', localContracts[selectedContract], [address])

      setTotalSupply(formatUnits(_totalSupply, _decimals))
      setMyBalance(formatUnits(_balanceOf, _decimals))
      setDecimals(_decimals)
    }
  }

  usePoller(getErc20Info, 3000)

  let contractTitle

  if(selectedContract) {
    contractTitle = (
      <p>
      <span style={{ verticalAlign: "middle" }}>
        <Blockie address={localContracts[selectedContract]["address"]} />
      </span>
      <span style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}>{selectedContract}</span>
      </p>
    )
  }

  const getAddressInfo = async values => {
    console.log(values)
    if(selectedContract) {
      let _balanceOf = await makeCall('balanceOf', localContracts[selectedContract], [values.address])
      let _allowanceOf = await makeCall('allowance', localContracts[selectedContract], [address, values.address])

      setAddressAllowance(formatUnits(_allowanceOf, decimals))
      setAddressBalance(formatUnits(_balanceOf, decimals))
    }
  }


  const executeUpdateFunction = async values => {
    console.log(values)
    let parsedAmount = parseUnits(values.amount,decimals)
    let args
    if(values.function=='transferFrom') {
      args = [values.fromAddress, values.toAddress, parsedAmount]
    } else {
      args = [values.toAddress, parsedAmount]
    }

    console.log(args)

    let selectedFunction = values.function?values.function:defaultUpdateFunction

    let result = await makeCall(selectedFunction, localContracts[selectedContract], args)

    notification.open({
      message: 'Success',
      description:
      `👀 ${selectedFunction}: ${values.amount} to ${values.toAddress}`,
    });
  }

  return (
              <Card style={{ maxWidth: 600, width: "100%", margin: 'auto'}}>
                <Radio.Group
                    options={contractOptions}
                    optionType="button"
                    onChange={(e) => {
                      setTotalSupply()
                      setMyBalance()
                      setAddressBalance()
                      setAddressAllowance()
                      setSelectedContract(e.target.value) }}
                    value={selectedContract}
                  />
                {selectedContract?<>
                <Divider/>
                {contractTitle}
                <Paragraph copyable={{text: localContracts[selectedContract]["address"]}}>{"Contract:" +localContracts[selectedContract]["address"].substring(0,7)}</Paragraph>
                <p>{"TotalSupply: "+totalSupply}</p>
                <p>{"Balance: "+myBalance}</p>
                {selectedContract&&localContracts[selectedContract]['mintTokens']?<Button onClick={() => {makeCall('mintTokens', localContracts[selectedContract])}}>Mint</Button>:null}
                {selectedContract&&localContracts[selectedContract]['outstandingTokens']?<Button onClick={async () => {
                  let result = await makeCall('outstandingTokens', localContracts[selectedContract])
                  let formattedResult = formatUnits(result, decimals)
                  notification.open({
                    message: 'Tokens outstanding',
                    description:
                    `👀 There are ${formattedResult} tokens available to claim`,
                  });
                }}>GetOutstanding</Button>:null}
                {selectedContract&&localContracts[selectedContract]['mintOutstandingTokens']?<Button onClick={() => {makeCall('mintOutstandingTokens', localContracts[selectedContract])}}>MintOutstanding</Button>:null}
                <Divider/>
                <div style={{margin:8}}>
                <Title level={4}>Interact</Title>
                <Form
                  form={updateForm}
                  layout="horizontal"
                  onFinish={executeUpdateFunction}
                  onFinishFailed={errorInfo => {
                    console.log('Failed:', errorInfo);
                    }}
                >
                <Form.Item name="function">
                <Radio.Group
                    options={['transfer', 'approve','increaseAllowance', 'decreaseAllowance', 'transferFrom']}
                    optionType="button"
                    onChange={(e) => {
                      console.log(e)
                      setUpdateFormFunction(e.target.value)
                    }}
                    defaultValue={defaultUpdateFunction}
                  />
                </Form.Item>
                {updateFormFunction=="transferFrom"?<Form.Item name="fromAddress" rules={[{ required: updateFormFunction=="transferFrom", message: 'Address to transfer from' }]}>
                  <AddressInput placeholder="fromAddress"
                  autoFocus
                  ensProvider={mainnetProvider}
                  />
                </Form.Item>:null}
                  <Form.Item name="toAddress" rules={[{ required: true, message: 'Please enter an address' }]}>
                    <AddressInput placeholder="address"
                    autoFocus
                    ensProvider={mainnetProvider}
                    />
                  </Form.Item>
                  <Form.Item name="amount" rules={[{ required: true, message: `Set the value to ${updateFormFunction}`}]}>
                    <Input placeholder="amount"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">Submit</Button>
                  </Form.Item>
                </Form>
                </div>
                <Divider/>
                <div style={{margin:8}}>
                <Title level={4}>Address Info</Title>
                <Form
                  form={addressInfoForm}
                  layout="horizontal"
                  onFinish={getAddressInfo}
                  onFinishFailed={errorInfo => {
                    console.log('Failed:', errorInfo);
                    }}
                >
                  <Form.Item name="address">
                    <AddressInput placeholder="address"
                    autoFocus
                    layout="inline"
                    ensProvider={mainnetProvider}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">Get address info</Button>
                  </Form.Item>
                </Form>
                {addressBalance?<p>{"Address Balance: "+addressBalance}</p>:null}
                {addressAllowance?<p>{"Address Allowance: "+addressAllowance}</p>:null}
                </div>
                </>:null}
              </Card>
  );
}

export default Erc20Demo;