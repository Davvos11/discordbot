FROM node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci --only=production

# Bundle app source
COPY . .

# Install cifs-utils so we can mount smb shares
RUN apt update -y && apt install cifs-utils -y

CMD [ "npm", "start"]