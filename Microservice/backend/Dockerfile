# Use the official Node.js image.
FROM node:18

WORKDIR /usr/src/app

COPY ./package*.json ./

# Install production dependencies.
RUN npm install

# Copy the source code into the container image.
COPY . ./

# Expose the port the app runs on
EXPOSE 5000

# Run the web service on container startup.
CMD ["node", "index.js"]
