import React, { Component } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import ProfilePicture from '../UIcomponents/ProfilePicture';
import BottomNavBar from '../UIcomponents/BottomNavNew';
import SOS from '../UIcomponents/SOSbutton';
import PushNotification from 'react-native-push-notification';
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/database';
import { Header, Button, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

export function setupPushNotification(
  onRegister,
  onNotification,
  popInitialNotification
) {
  PushNotification.configure({
    onRegister: onRegister,
    onNotification: onNotification,

    permissions: {
      alert: true,
      badge: true,
      sound: true
    },

    popInitialNotification: popInitialNotification,

    requestPermissions: true,
  });
  return PushNotification;
}

export default class ProfileSetupScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      user_id: firebase.auth().currentUser.uid,
    };
    this.notif = setupPushNotification(
      this.onRegister.bind(this),
      this.onNotif.bind(this),
      true
    );
  }

  onRegister(token) {
    Alert.alert("Registered !", JSON.stringify(token));
    console.log(token);
    //this.setState({ registerToken: token.token, gcmRegistered: true });
  }

  onNotif(notification) {
    const { navigate } = this.props.navigation;
    console.log(notification);

    if (notification.userInteraction) {
      if (
        notification.data.notificationType === 'medical' &&
        Platform.OS === 'ios'
      ) {
        this.notif.cancelLocalNotifications({ id: '0' });
        //reschedule it
        // this.notif = setupPushNotification(this.onRegister.bind(this), this.onNotif.bind(this));
        firebase
          .database()
          .ref(`medical/${this.state.user_id}`)
          .on('value', snapshot => {
            const {
              additional,
              age,
              allergies,
              blood_type,
              conditions,
              doctor_name,
              kin,
              medication,
              sex,
            } = snapshot.val();

            let ios_options = {
              date: new Date(Date.now() + 30000), // in 30 secs
              repeatType: 'day',
              id: '0',
              ticker: "My Notification Ticker",
              bigText: `Age: ${age}\n--------------\nSex: ${sex}\n--------------\nDoctor: ${doctor_name}\n--------------\nKin: ${kin}\n--------------\nBlood type: ${blood_type}\n--------------\nConditions: ${conditions}\n--------------\nAllergies: ${allergies}\n--------------\nMedication: ${medication}\n--------------\nAdditional: ${additional}`,
              color: "blue",
              alertAction: 'view',
              // data: data,
              visibility: "public",
              title: "Medical Profile",
              message: `Age: ${age}\n--------------\nSex: ${sex}\n--------------\nDoctor: ${doctor_name}\n--------------\nKin: ${kin}\n--------------\nBlood type: ${blood_type}\n--------------\nConditions: ${conditions}\n--------------\nAllergies: ${allergies}\n--------------\nMedication: ${medication}\n--------------\nAdditional: ${additional}`,
              playSound: false,
              foreground: false,
              userInfo: {
                notificationType: "medical"
              },
              data: JSON.stringify({ notificationType: 'medical' })
            };

            this.notif.scheduleLocalNotification(ios_options);
          });
      } else {
        navigate(notification.data.screen, {
          user_id: notification.data.sender_id,
        });
      }
    }
  }

  notificationListener() {
    // notification checker
    firebase
      .database()
      .ref(`notifications/${this.state.user_id}`)
      .on('child_added', snapshot => {
        const { msg, screen, sender_id, time, title } = snapshot.val();
        const { key: id } = snapshot;

        console.log('screen', screen.toString());
        let options = {
          id: id,
          autoCancel: false,
          bigText: msg,
          ongoing: true,
          priority: "high",
          visibility: "public",
          importance: "high",
          title: title,
          message: msg,
          playSound: true,
          vibrate: true,
          //tag: `${screen.toString()}`, //for android
          userInfo: {
            screen: screen.toString(),
            sender_id: sender_id.toString(),
          }, //for ios
          data: JSON.stringify({
            screen: screen.toString(),
            sender: sender_id.toString(),
          }),
        };
        //
        this.notif.localNotification(options);

        firebase
          .database()
          .ref(`notifications/${this.state.user_id}/${id}`)
          .remove();
      });
  }

  render() {
    return (
      // <View style={styles.container}>

      //           <ProfilePicture />
      //           {/* <SOS/>
      //           <BottomNavBar/> */}
      // </View>
      <View style={styles.main}>
        <Header
          backgroundColor="#0EA8BE"
          leftComponent={
            <Icon
              name="keyboard-backspace"
              color="#fff"
              size={23}
              style={{ padding: 5 }}
              onPress={() => {
                this.state.edit_mode
                  ? this.setState({ edit_mode: false })
                  : this.props.navigation.goBack();
              }}
            />
          }
          centerComponent={
            <Text
              style={{
                alignSelf: 'center',
                marginTop: 10,
                fontFamily: 'Roboto',
                color: 'white',
                fontSize: 20,
                fontWeight: '300'
              }}
            >
              Profile Picture Setup
            </Text>
          }
        />
        <View style={styles.container}>
          <Text style={styles.welcome}>
            Upload a profile picture by pressing the the below circle.
          </Text>
          <ProfilePicture />
          <Button
            type="clear"
            titleStyle={{
              color: '#0EA8BE',
              fontFamily: 'Roboto',
              marginTop: 30,
            }}
            onPress={() => 
              this.props.navigation.navigate("MedicalProfileSetup")
            }
            title="Skip"
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F7F6'
  },
  main: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    color: 'black'
  },
  welcome: {
    textAlign: 'center',
    fontFamily: 'Roboto',
    fontSize: 17,
    marginBottom: 20,
  }
});
