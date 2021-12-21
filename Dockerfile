FROM node

# Create app directory
WORKDIR /usr/src/app

# Install cifs-utils so we can mount smb shares
RUN apt-get update -y && apt-get install cifs-utils -y

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci --only=production

# Bundle app source
COPY . .

CMD [ "npm", "run", "prod"]
