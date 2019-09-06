// import React from 'react';
// import { TouchableOpacity, View, Text } from 'react-native';
// import { Actions } from 'react-native-router-flux';

// const DeleteOverlay = (props) => {
//     return (
//         <View style={styles.discardContainer}>
//             <Text style={{ color: 'black', alignSelf: 'center', fontSize: 20 }}>
//                     {props.children}
//             </Text>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', paddingTop: 50 }}>
//                 <TouchableOpacity 
//                     onPress={props.onPressYes}
//                     style={{ ...styles.DiscButtonContainer, backgroundColor: 'green' }}
//                 >
//                     <Text style={{ alignSelf: 'center', fontSize: 20 }}>
//                         Yes
//                     </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     onPress={props.onPressNo}
//                     style={{ ...styles.DiscButtonContainer, backgroundColor: 'red' }}
//                 >
//                     <Text style={{ alignSelf: 'center', fontSize: 20 }}>
//                         No
//                     </Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// };

// const styles = {
//     ButtonContainer: {
//         position: 'absolute',
//         bottom: 0,
//         backgroundColor: 'rgba(0, 0, 0, .0)',
//         flexDirection: 'row',
//         justifyContent: 'space-evenly',
//         borderRadius: 3,
//         alignSelf: 'center',
//         flex: 1,
//         paddingBottom: 30
//     },
//     ButtonSaveStyling: {
//         padding: 10,
//         borderWidth: 1,
//         backgroundColor: 'green',
//         marginLeft: 5,
//         marginRight: 5
//     },
//     discardContainer: {
//         position: 'absolute',
//         top: 60,
//         left: 30,
//         right: 30,
//         bottom: 60,
//         flex: 1,
//         backgroundColor: 'white',
//         alignSelf: 'stretch',
//         borderColor: 'black',
//         borderRadius: 10,
//         borderWidth: 3,
//         justifyContent: 'center',
//         alignContent: 'center'
//     },
//     DiscButtonContainer: {
//         marginLeft: 20,
//         marginRight: 20,
//         flex: 1
//     }
// };

// export { DeleteOverlay };