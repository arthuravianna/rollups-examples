import AuctionCard from "@/components/auction_card";
import { useEffect, useState } from "react";
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
let auction_counter:number; // current number of auction exhibited on page

function build_auction_list(offset: number, setFunction: Function) {
  let url = `${process.env.NEXT_PUBLIC_INSPECT_URL}/auctions?limit=${auction_limit}&offset=${offset}`
  console.log(url)

  fetch(url, {method: 'GET',mode: 'cors',})
  .then((response) => {
    response.json().then((inspect_res) => {
      let auctions = JSON.parse(ethers.utils.toUtf8String(inspect_res.reports[0].payload))

      auction_counter = auctions.length;

      setFunction(
        <Row md={3}>
          {auctions.map((auction: any) => {
            return (
              <Col key={auction.id}>
                <AuctionCard auction={auction} clickable={true}></AuctionCard>
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
  const [disable_prev_btn, setDisablePrevBtn] = useState(true);
  const [disable_next_btn, setDisableNextBtn] = useState(false);

  // build_auction_list on page load
  useEffect(() => {build_auction_list(curr_offset, setList)}, [])

  // disable or not the next btn
  useEffect(() => {
    auction_counter < auction_limit? setDisableNextBtn(true): setDisableNextBtn(false)
  }, [auction_counter]);

  function previous() {
    //setList(loading_auction_list)
    let new_offset = curr_offset - auction_limit;
    if (new_offset <= 0) {
      new_offset = 0;
      setDisablePrevBtn(true);
    } else {
      setDisablePrevBtn(false);
    }

    build_auction_list(new_offset, setList);
    setOffset(new_offset);
    setDisableNextBtn(false);
  }

  function next() {
    //setList(loading_auction_list)
    let new_offset = curr_offset + auction_limit;
    if (auction_counter < auction_limit) {
      setDisablePrevBtn(true);
    } else {
      setDisableNextBtn(false);
    }

    build_auction_list(new_offset, setList);
    setOffset(new_offset);
    setDisablePrevBtn(false);
  }


  return (
    <>
      {list}

      <div className="text-center">
        <Button variant="outline-secondary" className="m-2" disabled={disable_prev_btn} title="Previous" onClick={previous}><ChevronDoubleLeft/></Button>
        <span>{(curr_offset/auction_limit) + 1}</span>
        <Button variant="outline-secondary" className="m-2" disabled={disable_next_btn} title="Next" onClick={next}><ChevronDoubleRight/></Button>
      </div>

    </>
  );
}