# A couple of words about **SSL Certificate**

## You need the following stuffs, I think
- `privkey.pem`  : the private key for your certificate.
- `fullchain.pem`: the certificate file used in most server software.
- `chain.pem`    : used for OCSP stapling in Nginx >=1.3.7.
- `cert.pem`     : will break many server configurations, and should not be used
                 without reading further documentation (see link below).

We recommend not moving these files. For more information, see the Certbot
User Guide at https://certbot.eff.org/docs/using.html#where-are-my-certificates.

You can copy files from ```/etc/letsencrpt/live/<your web site name>``` 
to here. All the necessary files for node to run ssl will be here. 
You need to do this after the certificates are updated. 
The default for letsencrypt is 3 months.
```
cp  /etc/letsencrypt/live/<your web site name>/* .
```

Words for our sponsor - letsencrypt.org - If you have money, or when I make
real money, support the good folks at letsencrypt.org 
