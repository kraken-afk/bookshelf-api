import Hapi from '@hapi/hapi';
import chalk from 'chalk';
import {hello} from './utils/ascii.js';
import Books from './routes/Books.js';

init();

/**
 * Initializing server
 */
async function init() {
  const server = Hapi.server({
    port: 5000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });
  const msg = 'server waiting on ' + chalk.underline(server.info.uri) + ' ...';

  server.route(
      {path: '/books',
        method: 'post',
        handler: Books.handleMethod('post')});

  server.route(
      {path: '/books/{bookId?}',
        method: 'get',
        handler: Books.handleMethod('get')});

  server.route(
      {path: '/books/{bookId?}',
        method: 'put',
        handler: Books.handleMethod('put')});

  server.route(
      {path: '/books/{bookId?}',
        method: 'delete',
        handler: Books.handleMethod('delete')});

  server.start();

  console.log(chalk.blueBright(hello));
  console.log(chalk.blueBright.bold(msg));
}
