# Используйте официальный образ Node.js
FROM node:16

# Установите рабочую директорию внутри контейнера
WORKDIR /app

# Копируйте зависимости и исходный код в контейнер
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Установите порт, который ваше приложение будет использовать
EXPOSE 4444

# Запустите ваше Express.js приложение
CMD ["npm", "start"]