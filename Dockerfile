# Use the official Node.js 18 image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first to optimize layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the port your app runs on (must match app_port in README.md)
EXPOSE 5001

# Command to start your neural engine
CMD [ "node", "index.js" ]