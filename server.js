const sendEmail=require('./sendEmail');
require('dotenv').config();
const send=async()=>{
    const data =await sendEmail("godsadarsh@gmail.com","nsnn","otp");
    console.log(data)
}
send()