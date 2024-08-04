# Website Installation and Running Guide

This website is designed to run on Linux or Ubuntu server.

## System Requirements

- Linux or Ubuntu server for production, Windows or Ubuntu for development

## Installation Steps

1. Install Node.js (latest version)
2. Install MongoDB (latest version)
3. Install PM2 (latest version)
   * **sudo npm i pm2 -g**
4. Set up environment variables for PM2 from the template (.env.sample)
5. Install necessary libraries
   * **sudo npm i**

## Running the Server

To start the server in production, use the following command:
* **sudo pm2 start**

For development, use this command:
* **npm start**

## Customization

- To modify the logo for each site, access the `views/logo` directory

## Rebuild Vue

To rebuild Vue, run the following command:
* **npm run production**

## Initializing Data
To set up initial data, after starting the server, access the admin site URL:
* **site-admin.com/init-data**
---------------------------


# 网站安装和运行指南

本网站设计用于在 Linux 或 Ubuntu 服务器上运行。

## 系统要求

- 生产环境：Linux 或 Ubuntu 服务器
- 开发环境：Windows 或 Ubuntu

## 安装步骤

1. 安装 Node.js（最新版本）
2. 安装 MongoDB（最新版本）
3. 安装 PM2（最新版本）
   * **sudo npm i pm2 -g**
4. 从模板（.env.sample）设置 PM2 的环境变量
5. 安装必要的库
   * **sudo npm i**

## 运行服务器

在生产环境中启动服务器，使用以下命令：
* **sudo pm2 start**

在开发环境中，使用此命令：
* **npm start**

## 自定义

- 要修改每个站点的logo，请访问 `views/logo` 目录

## 重建 Vue

要重建 Vue，运行以下命令：
* **npm run production**

## 初始化数据
要设置初始数据，在启动服务器后，访问管理站点URL：
* **site-admin.com/init-data**