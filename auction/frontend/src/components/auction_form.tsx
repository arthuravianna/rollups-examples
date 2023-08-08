import { useState } from "react";
import { Form, FloatingLabel, Row, Col, Button, Spinner, Stack, Badge } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isAddress } from "web3-validator";
import { ethers } from "ethers";
import { IERC721Portal__factory, IERC721__factory, IInputBox__factory } from "@cartesi/rollups";
import { useRouter } from 'next/navigation';


enum FormStatus {
    FormReady,

    ApproveFailed,
    Approving,

    DepositFailed,
    Depositing,

    AddInputFailed,
    AddingInput,

    AuctionFailed,
    CreatingAuction,
    AuctionCreated
}


function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function check_erc721_deposit(addr:string, erc721:string, erc721id:number) {
    let url = `${process.env.NEXT_PUBLIC_INSPECT_URL}/balance/${addr}`

    let response = await fetch(url, {method: 'GET', mode: 'cors',});
    let inspect_res = await response.json();
    let payload_utf8 = ethers.utils.toUtf8String(inspect_res.reports[0].payload);

    let balances = JSON.parse(payload_utf8);

    if (!balances.erc721[erc721] || !balances.erc721[erc721].includes(erc721id)) {
        return false;
    }

    return true; // the user already deposited the ERC721 token
}

async function check_auction_creation(input_index:number) {
    let url = `${process.env.NEXT_PUBLIC_GRAPHQL_URL}`;
    let query = `{"query":"query noticesByInput {input(index: ${input_index}) {notices {edges {node {index input {index} payload}}}}}"}`;

    while (true) {
        let response = await fetch(url, {method: 'POST', mode: 'cors', headers: {"Content-Type": "application/json"}, body: query});
        if (!response.ok) {
            throw Error(`Failed to retrieve info from GRAPHQL (${process.env.NEXT_PUBLIC_GRAPHQL_URL}).`);
        }

        let notice = await response.json();

        if (!notice.data) {
            await sleep(200); // "sleep" for 200 ms
        } else if (notice.data.input.notices.edges.length == 0) {
            throw Error("Failed to create auction.");
        } else {
            const payload_utf8 = ethers.utils.toUtf8String(notice.data.input.notices.edges[0].node.payload);
            const payload_json = JSON.parse(payload_utf8);

            if (payload_json.type == "auction_create") {
                const auction_id = payload_json.content.id;
                return auction_id;
            }
        }
    }
}

function build_badge_component(status:number, label:string, ongoing:number, error:number) {
    if (status == error) {
        return <Badge bg="danger">{label}</Badge>;
    } else if (status > ongoing) {
        return <Badge bg="success">{label}</Badge>;
    }

    return <Badge bg="secondary">{label}</Badge>;
}

function tx_feedback(msg:string, status:number, spinner:boolean=true) {
    return (
        <div>
            <Stack gap={1} className="mb-2">
                <div className="text-center">
                    <span>{msg}</span>
                </div>

                {
                    spinner?
                        <div className="d-flex justify-content-center">
                            <Spinner className="my-2" animation="border" variant="secondary"></Spinner>
                        </div>
                    :
                        <></>
                }
            </Stack>

            <Stack direction="horizontal" gap={3} className="justify-content-center">
                {build_badge_component(status, "Approve", FormStatus.Approving, FormStatus.ApproveFailed)}
                {build_badge_component(status, "Deposit", FormStatus.Depositing, FormStatus.DepositFailed)}
                {build_badge_component(status, "addInput", FormStatus.AddingInput, FormStatus.AddInputFailed)}
                {build_badge_component(status, "Auction", FormStatus.CreatingAuction, FormStatus.AuctionFailed)}
            </Stack>
        </div>
    );
}

export default function AuctionForm({ wallet }: {wallet: any}) {
    const [feedback_msg, SetFeedbackMsg] = useState("");
    const [formStatus, SetFormStatus] = useState(FormStatus.FormReady);
    const router = useRouter();

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
        setERC721(e.target.value.toLocaleLowerCase());
    }
    function handle_erc721Id(e:React.ChangeEvent<HTMLInputElement>) {
        setERC721Id(parseInt(e.target.value));
    }
    function handle_erc20(e:React.ChangeEvent<HTMLInputElement>) {
        setERC20(e.target.value.toLocaleLowerCase());
    }
    function handle_auction_min_bid_amount(e:React.ChangeEvent<HTMLInputElement>) {
        setAuctionMinBidAmount(parseInt(e.target.value));
    }

    // datepicker
    const [auctionStartDate, setAuctionStartDate] = useState<Date>();
    const [auctionEndDate, setAuctionEndDate] = useState<Date>();

    function handle_start_date_change(new_date:Date) {
        setAuctionStartDate(new_date);
    }

    function handle_end_date_change(new_date:Date) {
        setAuctionEndDate(new_date);
    }

    async function create_auction() {
        if (!wallet) {
            return;
        }

        if (!erc721 || !erc721Id || !erc20 || !auctionTitle ||
            !auctionDescription || !auctionStartDate || !auctionEndDate ||
            !auctionMinBidAmount) {

            alert("Fill the remaining fields to create an auction.")
            return;
        }

        if (auctionStartDate <= new Date()) {
            alert("Start Date must be bigger than the current Date!");
            return;
        }

        if (auctionEndDate <= auctionStartDate) {
            alert("End Date must be bigger than Start Date!");
            return;
        }

        if (!isAddress(erc721)) {
            alert("The ERC721 address provided is not a valid address.");
            return;
        }

        if (!isAddress(erc20)) {
            alert("The ERC20 address provided is not a valid address.");
            return;
        }

        if (!(process.env.NEXT_PUBLIC_ERC721_PORTAL_ADDR && process.env.NEXT_PUBLIC_INPUT_BOX_ADDR)) {
            console.log("Missing ERC721Portal address and/or InputBox address in the .env file");
            return;
        }

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


        const signer = new ethers.providers.Web3Provider(wallet.provider, 'any').getSigner();
        const erc721PortalContract = new ethers.Contract(process.env.NEXT_PUBLIC_ERC721_PORTAL_ADDR, IERC721Portal__factory.abi, signer);
        const inputContract = new ethers.Contract(process.env.NEXT_PUBLIC_INPUT_BOX_ADDR, IInputBox__factory.abi, signer);

        let deposited = await check_erc721_deposit(wallet.accounts[0].address, erc721, erc721Id);
        if (!deposited) {
            const erc721Contract = new ethers.Contract(erc721, IERC721__factory.abi, signer);

            // Set the ERC721Portal as the new controller
            SetFormStatus(FormStatus.Approving);
            SetFeedbackMsg(`Setting the ERC721Portal as the controller of\n ${erc721} - Id: ${erc721Id}.`);
            try {
                let approve = await erc721Contract.approve(process.env.NEXT_PUBLIC_ERC721_PORTAL_ADDR, erc721Id);
                await approve.wait();
            } catch (error:any) {
                SetFormStatus(FormStatus.ApproveFailed);
                SetFeedbackMsg(error.data.message);
                return;
            }


            // call the deposit method of the Portal Contract to deposit the NFT in the Cartesi DApp
            SetFormStatus(FormStatus.Depositing);
            SetFeedbackMsg(`Depositing \n ${erc721} - Id: ${erc721Id}.`);
            try {
                let deposit = await erc721PortalContract.depositERC721Token(erc721, process.env.NEXT_PUBLIC_DAPP_ADDR, erc721Id, "0x", "0x");
                await deposit.wait();
            } catch (error:any) {
                SetFormStatus(FormStatus.DepositFailed);
                SetFeedbackMsg(error.data.message);
                return;
            }
        }

        // call addInput method of the InputBox Contract to create the auction
        SetFormStatus(FormStatus.AddingInput);
        SetFeedbackMsg(`Sending Input to create auction for \n ${erc721} - Id: ${erc721Id}.`);
        let auction_receipt;
        try {
            let input = await inputContract.addInput(process.env.NEXT_PUBLIC_DAPP_ADDR, ethers.utils.toUtf8Bytes(JSON.stringify(auction)));
            auction_receipt = await input.wait();
        } catch (error:any) {
            SetFormStatus(FormStatus.AddInputFailed);
            SetFeedbackMsg(error.data.message);
            return;
        }

        // check if the auction was created then redirect to auction page
        SetFormStatus(FormStatus.CreatingAuction);
        SetFeedbackMsg(`Input sent! Checking auction creation on Cartesi Auction DApp.`);
        try {
            let auction_id = await check_auction_creation(Number(auction_receipt.events[0].args[1]._hex));
            SetFormStatus(FormStatus.AuctionCreated);

            await sleep(300);
            router.push(`/auction/${auction_id}`);
        } catch (error:any) {
            SetFormStatus(FormStatus.AuctionFailed);
            SetFeedbackMsg(error);
        }
    }

    if (formStatus == FormStatus.ApproveFailed || formStatus == FormStatus.DepositFailed ||
        formStatus == FormStatus.AddInputFailed || formStatus == FormStatus.AuctionFailed) {
            return tx_feedback(feedback_msg, formStatus, false);
    }

    if (formStatus != FormStatus.FormReady) {
        return tx_feedback(feedback_msg, formStatus);
    }

    return (
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

            <Row className="mb-2">
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

            <Button variant="outline-secondary" className="float-end" onClick={create_auction}>
                Create
            </Button>
        </Form>
    );
}