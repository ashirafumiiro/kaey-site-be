## Send Email using SES

This Api is used to send email from the contact form using Amazon SES. It has only one lamba function, 
that receives a post request with parameters `name`, `email`, `phone`, `subject` and `message`.

#### Setup
The function needs a verified `email` address in `SES` and the evironment name. The parameters and the accepted domain is set in a file `secrets.json` saved in the same directory as the serverless.yml file.

An example of the file is shown below.
```json
{
    "NODE_ENV": "dev",
    "EMAIL": "mysuperusername@gmail.com",
    "DOMAIN": "*"
}
```
After that is in place. You will need a configured serverless framework environment to deplay the function by running the command below.

```bash
$ serverless deploy
```
You will get the link to which the request can be made.