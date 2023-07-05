import { useRouter } from 'next/router';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { HourglassTop, HourglassSplit, HourglassBottom } from 'react-bootstrap-icons';


interface AuctionInterface {
    id: number,
    state: number, // Created = 0, Started = 1, Finished = 2
    item: {erc721: string, token_id: number},
    erc20: string,
    title: string,
    description: string,
    start_date: number,
    end_date: number,
    min_bid_amount: number,
    //bids: Array<BidInterface>
}

export default function AuctionCard({auction}: {auction: AuctionInterface}) {
  const router = useRouter()
  let status_icon;
  let highest_bid_author = "No one made a bid yet";
  let highest_bid = 0;
  let highest_bid_timestamp = "";

  switch (auction.state) {
    case 0:
      status_icon = <HourglassTop className='float-end' title='Not started'></HourglassTop>;
      break;
    case 1:
      status_icon = <HourglassSplit className='float-end' title='Started'></HourglassSplit>;
      break;
    case 2:
      status_icon = <HourglassBottom className='float-end' title='Finished'></HourglassBottom>;
      break;

    default:
      // if (auction.bids.length > 0) {
      //   highest_bid_author = auction.bids[auction.bids.length - 1].author;
      //   highest_bid_timestamp = new Date(auction.bids[auction.bids.length - 1].timestamp).toLocaleString();
      // }
      break;
  }


  return (
    <Card className='m-2 clickable_card' onClick={()=>{
      router.push({
        pathname: '/auction/[id]',
        query: { id: auction.id },
      })
    }}>
      <Card.Body>
        <Card.Title>{auction.title} {status_icon}</Card.Title>

        <Card.Subtitle className="mb-2 text-muted" style={{fontSize: '12px'}}>
          {new Date(auction.start_date*1000).toLocaleString()} until {new Date(auction.end_date*1000).toLocaleString()}
        </Card.Subtitle>

        <Card.Text>
          {auction.description}
        </Card.Text>

        <Table size="sm" style={{fontSize: '12px'}}>
          <tbody>
            <tr>
              <td>Auction ID</td>
              <td>{auction.id}</td>
            </tr>
            <tr>
              <td>ERC 721</td>
              <td>{auction.item.erc721}</td>
            </tr>
            <tr>
              <td>Token ID</td>
              <td>{auction.item.token_id}</td>
            </tr>
            <tr>
              <td>ERC 20</td>
              <td>{auction.erc20}</td>
            </tr>
            <tr>
              <td>Min Bid Amount</td>
              <td>{auction.min_bid_amount}</td>
            </tr>
            {/* <tr>
              <td>Bids</td>
              <td>{auction.bids.length}</td>
            </tr> */}
          </tbody>
        </Table>
      </Card.Body>

      {/*<Card.Footer className='bg-white' style={{fontSize: '14px'}}>
         <div>
          {auction.state == 2? "Winner:": auction.state == 1?"Winning:": ""} {highest_bid_author}
        </div>

        <div>
          {highest_bid_timestamp}
        </div>

        <div className='float-end'>
          {auction.state != 0? `Highest Bid: ${highest_bid}`: ""}
        </div>
      </Card.Footer>*/}
    </Card>
  );

}

