import Container from "react-bootstrap/Container";
import Header from '@/components/header';
import AuctionList from '@/components/auction_list';

export default function HomePage() {
  return (
    <Container>
      <Header title="NFT Auction" />

      <div className="bg-light rounded">
        <AuctionList></AuctionList>
      </div>

    </Container>
  );
}