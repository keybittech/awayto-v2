import { ApiModule } from '../api';

const tests: ApiModule = [

  // {
  //   method: 'GET',
  //   path: 'test/event/400',
  //   cmnd: async () => {
  //     try {
  //       return false;
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // },

  // {
  //   method: 'GET',
  //   path: 'test/event/401',
  //   roles:'you_dont_have_this_role',
  //   cmnd: async () => {
  //     try {
  //       return true;
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // },

  // {
  //   method: 'POST',
  //   path: 'test',
  //   cmnd: async (props) => {
  //     try {

  //       const { file } = props.event.body;

  //       return true;

  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // },

  // {
  //   method: 'POST',
  //   path: 'test/signup',
  //   cmnd: async (props) => {
  //     try {
        
  //       console.log(props.event);

  //       return true;

  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // },

  // {
  //   method: 'GET',
  //   path: 'test/list/users',
  //   cmnd: async () => {
  //     try {

  //       // const listUsersResponse = await listUsers();

  //       // const mappedResposnse = listUsersResponse.Users?.map(u => {
  //       //   const user = {
  //       //     username: u.Username,
  //       //     status: u.UserStatus,
  //       //     groups: parseGroupString(u.Attributes?.find(a => a.Name == 'custom:admin')?.Value || '')
  //       //   } as IUserProfile;
  //       // })


  //       return true;

  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // },

];

export default tests;