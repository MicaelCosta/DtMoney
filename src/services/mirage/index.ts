import {
  createServer,
  Factory,
  Model /* Response */,
  ActiveModelSerializer,
} from "miragejs";
import faker from "faker";

type Transaction = {
  id: number;
  title: string;
  type: string;
  category: string;
  amount: number;
  created_at: string;
};

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeServer() {
  const server = createServer({
    serializers: {
      application: ActiveModelSerializer, //permite mandar dados de relacionamentos no mesmo objeto na mesma requisição
    },

    models: {
      //Partial define que não necessiriamente quem usar o model precisa ter/passar todos os campos
      transaction: Model.extend<Partial<Transaction>>({}),
    },

    //Gera dados em massa
    factories: {
      transaction: Factory.extend({
        id(i: number) {
          return i + 1;
        },
        title() {
          return faker.finance.transactionDescription();
        },
        type() {
          return randomInteger(1, 2) === 1 ? "deposit" : "withdraw";
        },
        category() {
          return faker.lorem.word(5);
        },
        amount() {
          return Number(faker.finance.amount(1, 10000));
        },
        createdAt() {
          return faker.date.recent(10);
        },
      }),
    },

    seeds(server) {
      server.createList("transaction", 10);
      /* server.db.loadData({
        transactions: [
          {
            id: 1,
            title: "Freelance de website",
            type: "deposit",
            category: "Dev",
            amount: 6000,
            createdAt: new Date("2021-02-12 09:00:00"),
          },
          {
            id: 2,
            title: "Aluguel",
            type: "withdraw",
            category: "Casa",
            amount: 1100,
            createdAt: new Date("2021-02-14 11:00:00"),
          },
        ],
      }); */
    },

    routes() {
      this.namespace = "api";
      this.timing = 750; //Delay da API

      // Jeito de definir rotas para uso
      /* this.get("/transactions", () => {
        return this.schema.all("transaction");
      });

      this.post("/transactions", (schema, request) => {
        const data = JSON.parse(request.requestBody);

        return schema.create("transaction", data);
      }); */

      //Jeito de definir rotas genericas do CRUD, SHORTHANDS
      this.get("/transactions");
      this.get("/transactions/:id");

      this.post("/transactions");

      //Problema no this
      /* this.get("/transactions", function (schema, request) {
        //Criando funcionalidade para paginação do mirage
        const { page = 1, per_page = 10 } = request.queryParams;

        const total = schema.all("transaction").length;

        const pageStart = (Number(page) - 1) * Number(per_page);
        const pageEnd = pageStart + Number(per_page);

        const transactions = this.serialize(
          schema.all("transaction")
        ).transactions.slice(pageStart, pageEnd);

        return new Response(
          200,
          { "x-total-count": String(total) },
          { transactions }
        );
      }); */

      this.namespace = "";
      this.passthrough();
    },
  });

  return server;
}
