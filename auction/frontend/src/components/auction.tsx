import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import AuctionCard from "@/components/auction_card";
import Bids from '@/components/bids';


export default function Auction({auction}: {auction: any}) {
    if (auction == undefined) {
        return;
    }

    return (
        <>
            <Row>
                <Col md={4}>
                    <div className='position-fixed'>
                        <AuctionCard auction={auction}></AuctionCard>
                    </div>

                </Col>
                <Col>
                    <div className='p-2'>
                        <Bids bids={auction.bids}></Bids>
                    </div>
                </Col>
            </Row>
        </>
    );
}