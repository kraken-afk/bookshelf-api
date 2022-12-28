import {nanoid} from 'nanoid';

/**
 * class for handle routing at 'books/'
 * @class
*/
class BooksManager {
  /**
 * An object representing book data
 * @typedef {Object} Book
 * @property {string} name - book title
 * @property {number} year - book release year
 * @property {string} author - author name
 * @property {string} summary - summary of the book
 * @property {string} publisher -  publisher name
 * @property {number} pageCount - amount of page's
 * @property {number} readPage - number of page that user currently read
 * @property {boolean} reading - indicating finished reading or not yet
 */

  /**
   * bookshelf
   * @type {Object} books shelf
   * @property {string} id
   */
  #_shelf = Object();

  /**
   * method for handling available http request
   * @method
   * @param {string} httpRequestMethod
   * @return {{type: function}} used for handler in server.route
   */
  handleMethod(httpRequestMethod) {
    const method = httpRequestMethod.toLowerCase();

    switch (method) {
      case 'get':
        return this.#getHandler();
      case 'post':
        return this.#postHandler();
      case 'put':
        return this.#putHandler();
      case 'delete':
        return this.#deleteHandler();
    }
  }

  // ////////////////////////////////////////////////
  // UTILITY  |  UTILITY  |  UTILITY  |  UTILITY ///
  // //////////////////////////////////////////////

  /**
   * getter for shelf
   * @return {Array<Book>} array of books
   * @param {Object} opt if any query(s) required
   */
  getBooks(opt = 'all') {
    if (opt === 'all') {
      return Object.values(this.#_shelf);
    }

    if (typeof opt === 'string') {
      return this.#_shelf[opt];
    }

    return this.#filterBooksBasedOnQuerys(opt);
  }

  /**
   * private method for storing book
   * @private
   * @param {Book} book
   * @return {string} bookId
   */
  #addBook(book) {
    const id = nanoid();
    book.finished = !!(book.pageCount === book.readPage);
    book.insertedAt = new Date().toISOString();
    book.updatedAt = new Date().toISOString();
    book.id = id;

    this.#_shelf[id] = book;
    return id;
  }

  /**
   * @param {Book} newBook
   * @return {boolean}
   */
  #updateBook(newBook) {
    const {id} = newBook;
    const updatedAt = new Date().toISOString();

    newBook.updatedAt = updatedAt;

    try {
      this.#_shelf[id] = {updatedAt, ...newBook, ...this.#_shelf[id]};
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @param {string} id
   */
  #deleteBook(id) {
    delete this.#_shelf[id];
  }

  /**
   * @return {Object}
   * @param {string} id
   * @property {boolean} status
   * @property {Book} data
   */
  #findBook(id) {
    if (this.#_shelf.hasOwnProperty(id)) {
      return ({status: true, data: this.getBooks(id)});
    } else {
      return ({status: false, data: null});
    }
  }

  /**
   * will filtering every books based on given query?
   * @param {Object} queryObj
   * @return {Array<Book>}
   * TODO: improve performance
   */
  #filterBooksBasedOnQuerys(queryObj) {
    if (!Object.keys(queryObj).length) {
      throw new Error('queryObj is an empty object');
    }

    const bagOfBooks = [];
    const querys = Object.entries(queryObj);
    const isPassed = new Int8Array(querys.length);

    for (const book of Object.values(this.#_shelf)) {
      for (let i = 0; i < querys.length; i++) {
        const [key, value] = querys[i];

        if (String(book[key]).toLowerCase()
            .includes(String(isNaN(+value) ? value : !!+value).toLowerCase())) {
          isPassed[i] = 1;
        }

        if (isPassed.every((test) => test)) {
          bagOfBooks.push(book);
        }

        isPassed.fill(0);
      }
    }

    return bagOfBooks;
  }

  /**
 * used for validatin payload in post method handler
 * @private
 * @param {Book} book
 * @return {Object}
 */
  #validatePayload(book) {
    /**
     * @type {Array<string>}
     */
    const bookObjectProperties = {
      'name': 'string',
      'year': 'number',
      'author': 'string',
      'summary': 'string',
      'publisher': 'string',
      'pageCount': 'number',
      'readPage': 'number',
      'reading': 'boolean',
    };
    const emptyNameMessage = 'empty name';
    const readPageErrMessage = 'readerPage is bigger then pageCount';
    let {status, message} = {
      status: false,
      message: 'generic error',
    };

    for (const key in bookObjectProperties) {
      // check if valid keys
      if (Object.keys(book).includes(key)) {
        // DICODING REQUISITE
        if (!book.name) {
          message = emptyNameMessage;
          return {status, message};
        }
        // DICODING REQUISITE
        if (book.readPage > book.pageCount) {
          message = readPageErrMessage;
          return {status, message};
        }
        // check data type
        if (typeof book[key] !== bookObjectProperties[key]) {
          return {status, message};
        }
        return {status: true, message: 'ok'};
      }
    }
    return false;
  }

  /**
 * private method for update book
 * @private
 * @param {Book} newBook
 * TODO: Improve search algorithm
 * currently using linear. O(n)
 * FUTURE: implement hash map
 */
  // #updateBook(newBook) {

  // }

  // ////////////////////////////////////////////////////////////////
  // PUT HANLDER  |  PUT HANDLER  |  PUT HANDLER  |  PUT HANDLER ///
  // //////////////////////////////////////////////////////////////
  /**
   * @return {function} h
   */
  #putHandler() {
    return (request, h) => {
      const newBook = request.payload;
      const {bookId} = request.params;
      const {status: isAvailable, data} = this.#findBook(bookId);

      if (!isAvailable) {
        const response = h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. Id tidak ditemukan',
        });

        response.code(404);
        response.type('application/json');

        return response;
      }

      const {status, message} = this.#validatePayload(newBook);

      // Error handling
      if (!status) {
        if (message === 'general error') {
          const response = h.response({
            status: 'fail',
            message: 'Gagal memperbarui buku',
          });

          response.code(500);
          response.type('application/json');

          return response;
        } else if (message === 'empty name') {
          const response = h.response({
            status: 'fail',
            message: 'Gagal memperbarui buku. Mohon isi nama buku',
          });

          response.code(400);
          response.type('application/json');

          return response;
        } else {
          const response = h.response({
            status: 'fail',
            message: 'Gagal memperbarui buku. ' +
            'readPage tidak boleh lebih besar dari pageCount',
          });

          response.code(400);
          response.type('application/json');

          return response;
        }
      } else {
        // Positive response
        const isUpdated = this.#updateBook(data);

        if (isUpdated) {
          return h.response({
            status: 'success',
            message: 'Buku berhasil diperbarui',
          })
              .code(200)
              .type('application/json');
        }
      }
    };
  }

  // ////////////////////////////////////////////////////////////////
  // GET HANLDER  |  GET HANDLER  |  GET HANDLER  |  GET HANDLER ///
  // //////////////////////////////////////////////////////////////
  /**
   * @return {function}
   */
  #getHandler() {
    return (request, h) => {
      // /////////////////////////////////
      // IF CLIENT REQUEST WITH QUERY ///
      // ///////////////////////////////
      if (Object.keys(request.query).length) {
        const books = this.getBooks(request.query);
        const response = h.response({status: 'success', data: {books: books}});
        response.code(200);
        response.type('application/json');

        return response;
      }

      // /////////////////////////////////
      // IF CLIENT REQUEST FOR DETAIL ///
      // ///////////////////////////////
      if (request.params.bookId) {
        const {bookId} = request.params;
        const book = this.getBooks(bookId);

        if (book === undefined) {
          return h.response({status: 'fail', message: 'Buku tidak ditemukan'})
              .code(404)
              .type('application/json');
        } else {
          return h.response({
            status: 'success',
            data: {
              book,
            },
          })
              .code(200)
              .type('application/json');
        }
      }

      // ////////////////////////
      // ELSE, GIVE THEM ALL ///
      // //////////////////////
      /**
       * some data of book
       * @type {Array<Object>} of books. contains:
       * @property {string} name
       * @property {string} id
       * @property {string} publisher
       */
      const books = this.getBooks();

      return h.response({
        status: 'success',
        data: {
          books,
        },
      })
          .code(200)
          .type('application/json');
    };
  }

  // //////////////////////////////////////////////////////////////
  // POST HANLDER | POST HANDLER | POST HANDLER | POST HANDLER ///
  // ////////////////////////////////////////////////////////////
  /**
   * @return {function}
   */
  #postHandler() {
    return (request, h) => {
      const book = request.payload;
      const validationResult = this.#validatePayload(book);
      const status = validationResult.status ? 'success' : 'fail';

      // //////////////////////
      // POSITIVE RESPONSE ///
      // ////////////////////
      if (validationResult.status) {
        const status = 'success';
        const message = 'Buku berhasil ditambahkan';
        const bookId = this.#addBook(book);

        return h.response({status, message, data: {bookId}})
            .code(201)
            .type('application/json');
      } else { // response 400 | 500
        const res = {message: '', code: null};

        // //////////////////////
        // NEGATIVE RESPONSE ///
        // ////////////////////
        if (validationResult.message === 'generic error') {
          res.message = 'Buku gagal ditambahkan';
          res.code = 500;
        } else if (validationResult.message === 'empty name') {
          res.message = 'Gagal menambahkan buku. Mohon isi nama buku';
          res.code = 400;
        } else {
          res.message =
            'Gagal menambahkan buku. readPage tidak ' +
            'boleh lebih besar dari pageCount';
          res.code = 400;
        }
        return h.response({status, message: res.message})
            .code(res.code)
            .type('application/json');
      }
    };
  }

  // //////////////////////////////////////////////////////////////////////
  // DELETE HANLDER | DELETE HANDLER | DELETE HANDLER | DELETE HANDLER ///
  // ////////////////////////////////////////////////////////////////////
  /**
   * @return {function}
   */
  #deleteHandler() {
    return (request, h) => {
      const {bookId} = request.params;
      const {status} = this.#findBook(bookId);

      if (!status) {
        const response = h.response({
          status: 'fail',
          message: 'Buku gagal dihapus. Id tidak ditemukan',
        });

        response.code(404);
        response.type('application/json');

        return response;
      }

      const response = h.response({
        status: 'success',
        message: 'Buku berhasil dihapus',
      });

      response.code(200);
      response.type('application/json');

      this.#deleteBook(bookId);

      return response;
    };
  }
}

const Books = new BooksManager;
export default Books;
