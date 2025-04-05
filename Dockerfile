# ✅ Use Node.js 18 as base image
FROM node:18

# ✅ Set working directory inside container
WORKDIR /app

# ✅ Copy package.json and package-lock.json
COPY package*.json ./

# ✅ Clear npm cache and install dependencies
RUN npm cache clean --force && npm install --omit=dev

# ✅ Optional: Clean previous modules and reinstall
RUN rm -rf node_modules package-lock.json && npm install --omit=dev

# ✅ Copy all source files
COPY . .

# ✅ Expose port 8080
EXPOSE 8080

# ✅ Increase File Upload Size Limit
ENV MAX_UPLOAD_SIZE=50MB

# ✅ Start the bot
CMD ["npm", "start"]
