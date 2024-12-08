# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your app runs on (in this case, 5173)
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev", "--", "--host"]
