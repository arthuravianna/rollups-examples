import { useConnectWallet } from "@web3-onboard/react";
import { Button, Col, FloatingLabel, Form, Modal, Row, Stack } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Navbar from 'react-bootstrap/Navbar';
import { PlusCircle } from "react-bootstrap-icons";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ethers } from "ethers";
import { isAddress } from 'web3-validator';
import { IERC721Portal__factory, IERC721__factory, IInputBox__factory } from "@cartesi/rollups";


const inspect_url = "http://localhost:5005/inspect/";
const erc721PortalAddr = "0x4CA354590EB934E6094Be762b38dE75d1Dd605a9";
const inputBoxAddr = "0x5a723220579C0DCb8C9253E6b4c62e572E379945";
const dappAddr = "0x142105FC8dA71191b3a13C738Ba0cF4BC33325e2";

async function check_erc721_deposit(addr:string, erc721:string, erc721id:number) {
    let url = `${inspect_url}balance/${addr}`

    let response = await fetch(url, {method: 'GET', mode: 'cors',});
    let inspect_res = await response.json();
    let payload_utf8 = ethers.utils.toUtf8String(inspect_res.reports[0].payload);

    let balances = JSON.parse(payload_utf8);

    if (!balances.erc721[erc721] || !balances.erc721[erc721].includes(erc721id)) {
        return false;
    }

    return true; // the user already deposited the ERC721 token
}


export default function Header({ title }: {title: String}) {
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()

    // modal
    const [showModal, setShowModal] = useState(false);

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    // form
    const [auctionTitle, setAuctionTitle] = useState<string>();
    const [auctionDescription, setAuctionDescription] = useState<string>();
    const [erc721, setERC721] = useState<string>();
    const [erc721Id, setERC721Id] = useState<number>();
    const [erc20, setERC20] = useState<string>();
    const [auctionMinBidAmount, setAuctionMinBidAmount] = useState<number>();

    function handle_auction_title(e:React.ChangeEvent<HTMLInputElement>) {
        setAuctionTitle(e.target.value);
    }
    function handle_auction_description(e:React.ChangeEvent<HTMLInputElement>) {
        setAuctionDescription(e.target.value);
    }
    function handle_erc721(e:React.ChangeEvent<HTMLInputElement>) {
        setERC721(e.target.value.toLocaleLowerCase());
    }
    function handle_erc721Id(e:React.ChangeEvent<HTMLInputElement>) {
        setERC721Id(parseInt(e.target.value));
    }
    function handle_erc20(e:React.ChangeEvent<HTMLInputElement>) {
        setERC20(e.target.value.toLocaleLowerCase());
    }
    function handle_auction_min_bid_amount(e:React.ChangeEvent<HTMLInputElement>) {
        setAuctionMinBidAmount(parseInt(e.target.value));
    }

    // datepicker
    const [auctionStartDate, setAuctionStartDate] = useState<Date>();
    const [auctionEndDate, setAuctionEndDate] = useState<Date>();

    function handle_start_date_change(new_date:Date) {
        if (new_date <= new Date()) {
            alert("Start Date must be bigger than the current Date!");
            return;
        }
        setAuctionStartDate(new_date);
    }

    function handle_end_date_change(new_date:Date) {
        if (auctionStartDate && new_date <= auctionStartDate) {
            alert("End Date must be bigger than Start Date!");
            return;
        }
        setAuctionEndDate(new_date);
    }

    async function create_auction() {

        if (!wallet) {
            return;
        }

        if (!erc721 || !erc721Id || !erc20 || !auctionTitle ||
            !auctionDescription || !auctionStartDate || !auctionEndDate ||
            !auctionMinBidAmount) {

            alert("Fill the remaining fields to create an auction.")
            return;
        }

        if (!isAddress(erc721)) {
            alert("The ERC721 address provided is not a valid address.");
            return;
        }

        if (!isAddress(erc20)) {
            alert("The ERC20 address provided is not a valid address.");
            return;
        }

        let auction = {
            "method": "create",
            "args": {
                "item": {
                    "erc721": erc721,
                    "token_id": erc721Id
                },
                "erc20": erc20,
                "title": auctionTitle,
                "description": auctionDescription,
                "start_date": Math.trunc(auctionStartDate.getTime()/1000), // Date to epoch (seconds)
                "end_date": Math.trunc(auctionEndDate.getTime()/1000), // Date to epoch (seconds)
                "min_bid_amount": auctionMinBidAmount
            }
        }

        console.log(auction);
        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();
        const erc721PortalContract = new ethers.Contract(erc721PortalAddr, IERC721Portal__factory.abi, signer);
        const inputContract = new ethers.Contract(inputBoxAddr, IInputBox__factory.abi, signer);

        let deposited = await check_erc721_deposit(wallet.accounts[0].address, erc721, erc721Id);
        if (!deposited) {
            // Set the ERC721Portal as the new controller
            const erc721Contract = new ethers.Contract(erc721, IERC721__factory.abi, signer);
            let approve = await erc721Contract.approve(erc721PortalAddr, erc721Id);
            approve.wait();

            // call the deposit method of the Portal Contract to deposit the NFT in the Cartesi DApp
            let deposit = await erc721PortalContract.depositERC721Token(erc721, dappAddr, erc721Id, "0x", "0x");
            deposit.wait();
        }

        // call addInput method of the InputBox Contract to create the auction
        inputContract.addInput(dappAddr, ethers.utils.toUtf8Bytes(JSON.stringify(auction))).then(console.log);

        handleClose();
    }

    return (
        <Navbar bg="light" className="mb-3 rounded">
            <Container>
                <Navbar.Brand href="/">
                    <img
                        alt="Cartesi Logo"
                        src="../../cartesi.png"
                        width="30"
                        height="30"
                        className="d-inline-block align-top"
                    />{' '}
                    {title}
                </Navbar.Brand>

                { // show "Create Auction" button only if conencted
                    wallet?
                        <Button className="ms-auto me-2" variant="outline-secondary" onClick={handleShow}>
                            <PlusCircle></PlusCircle> Create Auction
                        </Button>
                    :
                        <></>
                }

                <Button variant="outline-secondary" onClick={() => (wallet ? disconnect(wallet) : connect())}>
                    {connecting ? 'Connecting' : wallet ? 'Disconnect' : 'Connect Wallet'}
                </Button>
            </Container>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton className="border-0">
                    <Stack gap={0}>
                        <Modal.Title>New Auction</Modal.Title>
                        <span className="text-muted">Fill the info required to start an auction</span>
                    </Stack>

                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <FloatingLabel controlId="auctionTitle" label="Auction Title" className="mb-2 form_label_size">
                            <Form.Control placeholder="Default Title" onChange={handle_auction_title} />
                        </FloatingLabel>

                        <FloatingLabel controlId="auctionDescription" label="Auction Description" className="mb-2 form_label_size">
                            <Form.Control as="textarea" placeholder="Default Description" style={{ height: '100px' }} onChange={handle_auction_description} />
                        </FloatingLabel>

                        <Row className="g-2 mb-2">
                            <Col md="9">
                                <FloatingLabel controlId="ERC721Address" label="ERC721 Address" className="form_label_size">
                                    <Form.Control placeholder="0x..." onChange={handle_erc721} />
                                </FloatingLabel>
                            </Col>
                            <Col md="3">
                                <FloatingLabel controlId="ERC721Id" label="Token ID" className="form_label_size">
                                    <Form.Control placeholder="1" onChange={handle_erc721Id} />
                                </FloatingLabel>
                            </Col>
                        </Row>

                        <Row className="g-2 mb-2">
                            <Col md="9">
                                <FloatingLabel controlId="ERC20Address" label="ERC20 Address" className="mb-2 form_label_size">
                                    <Form.Control placeholder="0x..." onChange={handle_erc20} />
                                </FloatingLabel>
                            </Col>
                            <Col md="3">
                                <FloatingLabel controlId="ERC20MinBid" label="Min Bid Amount" className="form_label_size">
                                    <Form.Control placeholder="1" onChange={handle_auction_min_bid_amount} />
                                </FloatingLabel>
                            </Col>
                        </Row>


                        <Row>
                            <Col>
                                <label className="form_label_size">Auction Start Date</label>
                                <DatePicker className="form_label_size"
                                    selected={auctionStartDate}
                                    minDate={new Date()}
                                    onChange={handle_start_date_change}
                                    showTimeSelect
                                    timeIntervals={15}
                                    dateFormat="Pp"
                                />
                            </Col>

                            <Col>
                                <label className="form_label_size">Auction End Date</label>
                                <DatePicker className="form_label_size"
                                    selected={auctionEndDate}
                                    minDate={auctionStartDate? auctionStartDate: new Date()}
                                    onChange={handle_end_date_change}
                                    showTimeSelect
                                    timeIntervals={15}
                                    dateFormat="Pp"
                                />
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="outline-secondary" onClick={create_auction}>
                        Create
                    </Button>
                </Modal.Footer>
            </Modal>
        </Navbar>
    );
}