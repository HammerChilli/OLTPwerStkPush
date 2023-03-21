import mondaySdk from "monday-sdk-js";
import csv from "csvtojson";
import * as dotenv from "dotenv";
dotenv.config();
const monday = mondaySdk();

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCsvData() {
const csvFilePath = process.env.FILEPATH;
let csvData = await csv().fromFile(csvFilePath);
csvData = csvData.map((e) => {
    return {
        OLT: e.OLT,
        PWRSTK: e.PWRSTK
    }
})
return csvData
}

async function oltBoardQuery() {
    monday.setToken(`${process.env.MONDAY_API_KEY}`);
    const mondayObj = await monday.api(`query{ boards (ids: ${process.env.MONDAY_BOARD_ID}){ items{ id name}}}`);
    return mondayObj;
}

async function combineAndMutate() {
    let csvData = await getCsvData();
    let oltBoardObj = await oltBoardQuery();
for (let item of oltBoardObj.data.boards[0].items){
    let found = csvData.find(e => e.OLT == item.name);
    console.log(found);
    if(found){
        let res = await mutateBoard(item.id, found.PWRSTK);
        console.log(res);
    } else {
        console.log(`${item.name} not included`)
    }
}
}

async function mutateBoard(itemId, pwrStk) {
    monday.setToken (`${process.env.MONDAY_API_KEY}`);
    const mondayMutate = await monday.api(`mutation { complexity{query after} change_simple_column_value(item_id: ${itemId}, board_id: ${process.env.MONDAY_BOARD_ID}, column_id: ${process.env.MODAY_COLUMN_ID}, value: "${pwrStk}", create_labels_if_missing: true){id name}}`);
    if(mondayMutate.data.complexity.after < 2000000){
        await sleep(20000);
    }
    else{
    return mondayMutate;
    }
}

await combineAndMutate();
console.log("done");


