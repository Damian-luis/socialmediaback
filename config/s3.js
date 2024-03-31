require ('dotenv').config()
const SECRET_KEY=process.env.SECRET_KEY
const NAME_BUCKET=process.env.NAME_BUCKET
const REGION=process.env.REGION
const ACCESS_KEY_ID=process.env.ACCESS_KEY_ID
const SECRET_ACESS_KEY_ID=process.env.SECRET_ACESS_KEY_ID
const BUCKET_NAME=process.env.BUCKET_NAME
module.exports={SECRET_KEY,NAME_BUCKET,REGION,ACCESS_KEY_ID,SECRET_ACESS_KEY_ID,BUCKET_NAME}