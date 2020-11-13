FROM node:10

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /code

RUN apt-get update
RUN apt-get -y install zip

RUN npm install yarn

RUN chmod +x /usr/local/bin/yarn

COPY ./package.json /code

RUN yarn install --no-bin-links

COPY ./ /code

RUN zip -r /lambda.zip ./
