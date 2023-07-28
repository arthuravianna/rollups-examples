import { useConnectWallet } from "@web3-onboard/react";
import { Button, Col, FloatingLabel, Form, Modal, Row, Stack } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Navbar from 'react-bootstrap/Navbar';
import { PlusCircle } from "react-bootstrap-icons";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
        setERC721(e.target.value);
    }
    function handle_erc721Id(e:React.ChangeEvent<HTMLInputElement>) {
        setERC721Id(parseInt(e.target.value));
    }
    function handle_erc20(e:React.ChangeEvent<HTMLInputElement>) {
        setERC20(e.target.value);
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

    function create_auction() {
        if (!erc721 || !erc721Id || !erc20 || !auctionTitle ||
            !auctionDescription || !auctionStartDate || !auctionEndDate ||
            !auctionMinBidAmount) {

            alert("Fill the remaining fields to create an auction.")
            return;
        }

        // TODO
        // check if the erc721 and erc20 are valid addresses.

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

        // TODO
        // transaction to create the auction.
        console.log(auction);
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

                <Button className="ms-auto me-2" variant="outline-secondary" onClick={handleShow}>
                    <PlusCircle></PlusCircle> Create Auction
                </Button>

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