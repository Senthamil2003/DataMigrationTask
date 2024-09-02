# Use the official Node.js image.
FROM node:18

WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY ./package*.json ./

# Install production dependencies.
RUN npm install

# Copy the source code into the container image.
COPY . ./

# Expose the port the app runs on
EXPOSE 5001

# Run the web service on container startup.
CMD ["node", "index.js"]
