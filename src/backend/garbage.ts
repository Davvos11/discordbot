import axios from 'axios'
import dateFormat from 'dateformat'

const COMPANY_CODE = "8d97bb56-5afd-4cbc-a651-b4f7314264b4"
const ADDRESS_ID = "1300030134"
/*
Unique address ID can be received with:
curl -XPOST https://twentemilieuapi.ximmio.com/api/FetchAdress -H "Content-Type: application/x-www-form-urlencoded" \
-d "companyCode=8d97bb56-5afd-4cbc-a651-b4f7314264b4&postCode=1234AB&houseNumber=123&houseLetter="
 */

// Format of API response
type data = {
    pickupDates: [string],
    pickupType: number,
    _pickupType: number,
    _pickupTypeText: string,
    description: string
}

export type garbageData = {date: Date, type: string, description: string}

export async function getPickups(startDate: Date, endDate: Date) {
    const response = await axios.post("https://wasteapi.2go-mobile.com/api/GetCalendar", {
        companyCode: COMPANY_CODE,
        uniqueAddressID: ADDRESS_ID,
        startDate: dateFormat(startDate, "yyyy-mm-dd"),
        endDate: dateFormat(endDate, "yyyy-mm-dd")
    })

    const pickups = response.data.dataList as [data]

    return processData(pickups) as [garbageData]
}

function processData(pickups: [data]) {
    const result = []

    // Extract information for each date
    pickups.forEach((value) => {
        value.pickupDates.forEach((date)=>{
            result.push({
                date: new Date(date),
                type: value._pickupTypeText,
                description: value.description
            })
        })
    })

    // Sort by date
    result.sort(((a, b) => a.date - b.date))

    return result
}