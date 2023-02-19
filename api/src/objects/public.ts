import { ApiModule } from '../api';

const tests: ApiModule = [

  {
    method: 'GET',
    path: 'health',
    cmnd: async () => {
      try {
        return true;
      } catch (error) {
        throw error;
      }
    }
  },

  // {
  //   method: 'GET',
  //   path: 'public/:path',
  //   cmnd: async (props) => {
  //     try {
        
  //       const { path } = props.event.pathParameters;

  //       switch(path) {
  //         case 'roles':
  //           return (await props.db.query<IRole>(`SELECT * FROM roles`)).rows;
  //         default:
  //           break;
  //       }

  //       return false;
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // },

  // {
  //   method: 'POST',
  //   path: 'public',
  //   cmnd: async (props) => {
  //     try {
  //       return [];// { result: "you posted public", ...props.event.body };
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // },

  // {
  //   method: 'POST',
  //   path: 'public/:path',
  //   cmnd: async (props) => {
  //     const { path } = props.event.pathParameters;
  //     try {
  //       return true; //{ result: "you posted public path of " + path, ...props.event.body };
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // }

];

export default tests;