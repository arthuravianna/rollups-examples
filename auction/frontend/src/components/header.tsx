import { useConnectWallet } from "@web3-onboard/react";
import { ethers } from 'ethers'
import { Button } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Navbar from 'react-bootstrap/Navbar';

export default function Header({ title }: {title: String}) {
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()

    // create an ethers provider
    let ethersProvider

    if (wallet) {
        ethersProvider = new ethers.providers.Web3Provider(wallet.provider, 'any')
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

                <Button variant="outline-secondary" onClick={() => (wallet ? disconnect(wallet) : connect())}>
                    {connecting ? 'Connecting' : wallet ? 'Disconnect' : 'Connect Wallet'}
                </Button>
            </Container>
        </Navbar>
    );
}