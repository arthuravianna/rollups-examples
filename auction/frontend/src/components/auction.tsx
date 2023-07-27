import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import AuctionCard from "@/components/auction_card";
import Bids from '@/components/bids';
import { Button, Form } from 'react-bootstrap';
import { useConnectWallet } from '@web3-onboard/react';
import { ethers } from "ethers";
import { useEffect, useState } from 'react';


let inspect_url = "http://localhost:5005/inspect/";

async function get_balance(addr:string, erc20:string) {
    let url = `${inspect_url}balance/${addr}`

    let inspect_res = (await fetch(url, {method: 'GET',mode: 'cors'}));
    let inspect_res_str = await inspect_res.text();
    let inspect_json = JSON.parse(inspect_res_str);
    let balances = JSON.parse(ethers.utils.toUtf8String(inspect_json.reports[0].payload));

    if (balances.erc20 === undefined) {
        return 0;
    }

    return balances.erc20[erc20];
}

function make_bid() {
    console.log("Placing a bid");
}

export default function Auction({auction}: {auction: any}) {
    const [l2_balance, setL2Balance] = useState(0);
    const [bid_form, setBidForm] = useState(<></>);
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();


    useEffect(() => {
        if (wallet && auction) {            
            get_balance(wallet.accounts[0].address, auction.erc20)
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
                            <Form.Control required />
                        </Col>
                    </Form.Group>
                    
                    <div className='d-flex justify-content-center'>
                        <Button type="button" variant="outline-secondary" onClick={make_bid} >Place Bid</Button>
                    </div>
                    
                </Form>
            ));
        }
    }, [l2_balance])


    return (
        <>
            <Row>
                <Col md={4}>
                    <div className='position-fixed'>
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