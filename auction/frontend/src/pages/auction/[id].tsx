import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Header from '@/components/header';
import { ethers } from "ethers";
import Auction from '@/components/auction';


async function process_inspect_call(url: string) {
  let result;
  let response = await fetch(url, {method: 'GET', mode: 'cors',});

  if (response.status == 200) {
    let inspect_res = await response.json();
    let payload_utf8 = ethers.utils.toUtf8String(inspect_res.reports[0].payload);

    try {
      result = JSON.parse(payload_utf8);
    } catch (error) {
      result = payload_utf8
    }
  }

  return result;
}

async function get_auction(auction_id: number) {
  let url = `${process.env.NEXT_PUBLIC_INSPECT_URL}/auctions/${auction_id}`;
  let auction = await process_inspect_call(url);

  url = `${process.env.NEXT_PUBLIC_INSPECT_URL}/auctions/${auction_id}/bids`;
  auction.bids = await process_inspect_call(url);

  return auction
}

export default function AuctionPage() {
  const router = useRouter();
  const [auction, setAuction] = useState(undefined);

  useEffect(() => {
    if (router.isReady && router.query.id) {
      let auction_id = parseInt(typeof router.query.id == "string"? router.query.id: router.query.id[0]);
      get_auction(auction_id)
      .then((result) => {
        setAuction(result);
      });
    }
  }, [router.isReady]);


  return (
    <Container>
      <Header title="NFT Auction" />

      <div className='bg-light rounded'>
        <Auction auction={auction}></Auction>
      </div>


    </Container>
  );
}