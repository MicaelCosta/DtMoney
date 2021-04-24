import {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useContext,
} from "react";
import { useQuery, useMutation } from "react-query";
import { api } from "../services/api";
import { queryClient } from "../services/queryClient";

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
  created_at: string;
}

interface CreateTransactionFormData {
  title: string;
  amount: number;
  type: string;
  category: string;
}

type TransactionInput = Omit<Transaction, "id" | "createdAt">;
//type TransactionInput = Pick<Transaction, 'title' | 'amount' | 'type' | 'category'>;
/* interface TransactionInput {
  title: string;
  amount: number;
  type: string;
  category: string;
} */

interface TransactionsProviderProps {
  children: ReactNode;
}

interface TransactiosContextData {
  transactions: Transaction[];
  createTransaction: (transaction: TransactionInput) => Promise<void>;
  handlePretechTransaction: (transactionId: number) => Promise<void>;
  createTransactionMutation: (
    transaction: CreateTransactionFormData
  ) => Promise<void>;
}

const TransactionsContext = createContext<TransactiosContextData>(
  {} as TransactiosContextData
);

async function getTransactions(): Promise<Transaction[]> {
  const { data } = await api.get("/transactions");

  return data.transactions;
}

async function getTransaction(transactionId: number): Promise<Transaction> {
  const { data } = await api.get(`/transactions/${transactionId}`);

  return data;
}

export function TransactionsProvider({ children }: TransactionsProviderProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  //A funcionalidade de query é somente para get e listagem, para post, put e delete usar o Mutations

  //Primeiro parametro é a chave
  //Segundo parametro é  o método que vai retornar os dados
  //Faz a chamada para api, mas apenas para revalidar os dados enquanto já disponibilizou
  //Toda vez que sai a tela/aba entra em focus, executa o revalidate fazendo chamada na api
  //Pode desabilitar ou mudar o tempo de revalidate
  //isLoading é o load que ocorre quando não tem os dados cacheados
  //isFetching é o load que ocorre ao revalidar os dados absoletos
  //Sempre que precisar que uma informação mude o funcionamento do cache, deve passar como chave
  //Ex. Chave: ['transactions', page] -> page sendo um variavel da pagina
  //E as chaves continuam no cache
  const { data, isLoading /* , isFetching */, error } = useQuery(
    "transactions",
    getTransactions,
    {
      staleTime: 1000 * 60 * 10 /*10 minutos*/, //5 segundos //Define o tempo em milisegundos que os dados não serão considerados obsoletos
    }
  );

  const createTransactionMutation = useMutation(
    async (transaction: CreateTransactionFormData) => {
      const response = await api.post(`/transactions`, {
        transaction: {
          ...transaction,
          id: new Date().getTime(),
          createdAt: new Date(),
        },
      });

      return response.data.transaction;
      //setTransactions([...transactions, response.data.transaction]);
    },
    {
      onSuccess: () => {
        //Se deu sucesso, invalida o cache gerad, passando a chave que deseja invalidar
        queryClient.invalidateQueries("transactions");

        //Ex. de editar no cache
        //variables e data vindo dos parametros do onSuccess
        //queryClient.setQueryData(['transactions', { id: variables.id }], data);
      },
    }
  );

  useEffect(() => {
    if (isLoading) {
      return setTransactions([]);
    }

    if (error) return setTransactions([]);

    setTransactions(data || []);
  }, [data, isLoading, error]);

  /* useEffect(() => {
    api
      .get("/transactions")
      .then((response) => setTransactions(response.data.transactions));
  }, []); */

  //Realiza um pre-fetch dos dados, chamada assim que passa o mouse em cima do registro da tabela
  async function handlePretechTransaction(transactionId: number) {
    await queryClient.prefetchQuery(
      ["transactions", transactionId],
      () => getTransaction(transactionId),
      { staleTime: 1000 * 60 * 10 /*10 minutos*/ }
    );
  }

  async function createTransaction(transactionInput: TransactionInput) {
    const response = await api.post("/transactions", {
      ...transactionInput,
      createdAt: new Date(),
    });

    const { transaction } = response.data;

    setTransactions([...transactions, transaction]);
  }

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        createTransaction,
        handlePretechTransaction,
        createTransactionMutation: (transaction: CreateTransactionFormData) =>
          createTransactionMutation.mutateAsync(transaction),
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);

  return context;
}
