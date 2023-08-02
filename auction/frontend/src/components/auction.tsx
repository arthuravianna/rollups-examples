import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import AuctionCard from "@/components/auction_card";
import Bids from '@/components/bids';
import { Button, Form } from 'react-bootstrap';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from "ethers";
import { useEffect, useState } from 'react';
import { IInputBox__factory } from '@cartesi/rollups';


const dappAddr = "0x142105FC8dA71191b3a13C738Ba0cF4BC33325e2";

async function get_l2_balance(addr:string, erc20:string) {
    let url = `${process.env.NEXT_PUBLIC_INSPECT_URL}/balance/${addr}`

    let inspect_res = (await fetch(url, {method: 'GET',mode: 'cors'}));
    let inspect_json = await inspect_res.json();
    let balances = JSON.parse(ethers.utils.toUtf8String(inspect_json.reports[0].payload));

    if (balances.erc20 === undefined) {
        return 0;
    }

    return balances.erc20[erc20];
}


export default function Auction({auction}: {auction: any}) {
    const [auction_card_fixed, setAuctionCardFixed] = useState(false);
    const [l2_balance, setL2Balance] = useState(0);
    const [bid_form, setBidForm] = useState(<></>);
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
    let bid_amount:number;

    useEffect(() => {
        // if scrollbar visible, set the auction card to be fixed
        if (document && document.body.clientHeight > window.innerHeight) {
            setAuctionCardFixed(true);
        }
    }, [])

    useEffect(() => {
        if (wallet && auction) {
            get_l2_balance(wallet.accounts[0].address, auction.erc20)
            .then((result) => {
                setL2Balance(result);
            })
            .catch(() => {setL2Balance(0)})
        }
      }, [wallet, auction]);

    useEffect(() => {
        if (auction) {
            setBidForm((
                <Form className='m-2'>
                    <Form.Group as={Row} className="mb-1" controlId="bidFormERC20Token">
                        <Form.Label column sm="3">
                            Bid Token
                        </Form.Label>
                        <Col sm="9">
                            <Form.Control plaintext readOnly defaultValue={auction.erc20} style={{fontSize: '13px'}}/>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-1" controlId="bidFormERC20TokenBalance">
                        <Form.Label column sm="3">
                            Balance
                        </Form.Label>
                        <Col sm="9">
                            <Form.Control plaintext readOnly defaultValue={l2_balance} style={{fontSize: '13px'}}/>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3" controlId="bidFormERC20TokenAmount">
                        <Form.Label column sm="3">
                            Amount
                        </Form.Label>
                        <Col sm="9">
                            <Form.Control required onChange={(event) => {bid_amount = parseInt(event.target.value);}} />
                        </Col>
                    </Form.Group>

                    <div className='d-flex justify-content-center'>
                        <Button type="button" variant="outline-secondary" onClick={place_bid} >Place Bid</Button>
                    </div>

                </Form>
            ));
        }
    }, [l2_balance])


    function place_bid() {
        let bid = {
            "method": "bid",
            "args": {
                "amount": bid_amount,
                "auction_id": auction.id
            }
        }

        if (!wallet || !bid_amount) return;

        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();
        const inputContract = new ethers.Contract(process.env.NEXT_PUBLIC_INPUT_BOX_ADDR, IInputBox__factory.abi, signer);
        inputContract.addInput(dappAddr, ethers.utils.toUtf8Bytes(JSON.stringify(bid))).then(console.log);
    }

    return (
        <>
            <Row>
                <Col md={4}>
                    <div className={auction_card_fixed? "position-fixed":""}>
                        <AuctionCard auction={auction} clickable={false}></AuctionCard>
                        {bid_form}
                    </div>
                </Col>

                <Col>
                    <div className='p-2'>
                        <Bids bids={auction?.bids}></Bids>
                    </div>
                </Col>
            </Row>
        </>
    );
}