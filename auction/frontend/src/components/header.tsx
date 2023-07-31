import { useConnectWallet } from "@web3-onboard/react";
import { Button, Modal, Stack } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Navbar from 'react-bootstrap/Navbar';
import { PlusCircle } from "react-bootstrap-icons";
import { useState } from "react";
import AuctionForm from "./auction_form";


export default function Header({ title }: {title: String}) {
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()

    // modal
    const [showModal, setShowModal] = useState(false);

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

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
                    <AuctionForm wallet={wallet}></AuctionForm>
                </Modal.Body>
            </Modal>
        </Navbar>
    );
}