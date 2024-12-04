// client/src/theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'black',
        color: 'white'
      }
    }
  },
  colors: {
    brand: {
      primary: 'red.500',
      secondary: 'red.600'
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'red'
      }
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'red.500'
      }
    }
  }
});

export default theme;