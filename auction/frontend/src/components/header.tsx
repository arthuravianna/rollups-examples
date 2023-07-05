import Container from "react-bootstrap/Container";
import Navbar from 'react-bootstrap/Navbar';

export default function Header({ title }: {title: String}) {

    return (
        <Navbar bg="light" className="mb-3 rounded">
            <Container>
                <Navbar.Brand >
                    <img
                        alt="Cartesi Logo"
                        src="../../cartesi.png"
                        width="30"
                        height="30"
                        className="d-inline-block align-top"
                    />{' '}
                    {title}
                </Navbar.Brand>
            </Container>
        </Navbar>
    );
}