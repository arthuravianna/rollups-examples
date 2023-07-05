import AuctionCard from "@/components/auction_card";
import { useState } from "react";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { ChevronDoubleRight, ChevronDoubleLeft } from 'react-bootstrap-icons';
import { ethers } from "ethers";

const loading_auction_list = <div className="d-flex justify-content-center">
  <Spinner className="my-2" animation="border" variant="dark">
    <span className="visually-hidden">Loading...</span>
  </Spinner>
</div>
const auction_limit = 6;  // number of auctions per page
let inspect_url = "http://localhost:5005/inspect/";

function build_auction_list(offset: number, setFunction: Function) {
  let url = `${inspect_url}auctions?limit=${auction_limit}&offset=${offset}`

  fetch(url, {method: 'GET',mode: 'cors',})
  .then((response) => {
    response.text().then((inspect_res_str) => {
      let inspect_res = JSON.parse(inspect_res_str);
      let auctions = JSON.parse(ethers.utils.toUtf8String(inspect_res.reports[0].payload))

      setFunction(
        <Row md={3}>
          {auctions.map((auction: any) => {
            return (
              <Col key={auction.id}>
                <AuctionCard auction={auction}></AuctionCard>
              </Col>
            )
          })}
        </Row>
      );
    });
  })
  .catch((error) => {
    console.log(error)
    setFunction(
      <div className="d-flex justify-content-center">
        Unable to get Auction List!
        <br></br>
        {error.toString()}
      </div>
    )
  });
}

export default function AuctionList() {
  const [curr_offset, setOffset] = useState(0);
  const [list, setList] = useState(loading_auction_list);

  function previous() {
    //setList(loading_auction_list)
    setOffset(curr_offset - auction_limit);
    //build_auction_list(curr_offset, setList);
  }

  function next() {
    //setList(loading_auction_list)
    setOffset(curr_offset + auction_limit);
    //build_auction_list(curr_offset, setList);
  }

  build_auction_list(curr_offset, setList)

  return (
    <>
      {list}

      <div className="text-center">
        <Button variant="outline-secondary" className="m-2" title="Previous" onClick={previous}><ChevronDoubleLeft/></Button>
        <span>{(curr_offset/auction_limit) + 1}</span>
        <Button variant="outline-secondary" className="m-2" title="Next" onClick={next}><ChevronDoubleRight/></Button>
      </div>

    </>
  );
}