# Use an official Node.js 18 image as the base
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install the NativeScript CLI globally inside the container
RUN npm install -g nativescript

# (Optional) Install ns doctor to check the environment
# RUN npm install -g @nativescript/doctor

# This line tells Docker what command to run when the container starts.
# We'll use "bash" to get an interactive terminal.
CMD [ "bash" ]
