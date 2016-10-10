/*!
 * React Native Autolink
 *
 * Copyright 2016 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/react-native-autolink/blob/master/LICENSE
 */
'use strict';

import React, {Component, PropTypes, createElement} from 'react';
import Autolinker from 'autolinker';
import {Linking, StyleSheet, Text} from 'react-native';

export default class Autolink extends Component {
  _onPress(match) {
    let type = match.getType();

    switch (type) {
      case 'email':
        Linking.openURL(`mailto:${encodeURIComponent(match.getEmail())}`);
      case 'hashtag':
        let tag = encodeURIComponent(match.getHashtag());

        switch (this.props.hashtag) {
          case 'instagram':
            Linking.openURL(`instagram://tag?name=${tag}`);
          case 'twitter':
            const url = `twitter://search?query=%23${tag}`;
            Linking.canOpenURL(url).then(supported => {
                if (!supported) {
                    Linking.openURL(`https://www.twitter.com/search?q=${tag}`);
                } else {
                    Linking.openURL(url);
                }
            });
            break;
          default:
            Linking.openURL(match.getMatchedText());
        }
        break;
      case 'phone':
        return Linking.openURL(`tel:${match.getNumber()}`);
      case 'twitter':
        const twitterHandle = encodeURIComponent(match.getTwitterHandle());
        const url = `twitter://user?screen_name=${twitterHandle}`;
        Linking.canOpenURL(url).then(supported => {
            if (!supported) {
                Linking.openURL(`https://www.twitter.com/${twitterHandle}`);
            } else {
                Linking.openURL(url);
            }
        });
        break;
      case 'url':
        Linking.openURL(match.getAnchorHref());
      default:
        Linking.openURL(match.getMatchedText());
      }
  }

  renderLink(text, match, index) {
    let truncated = (this.props.truncate > 0) ? Autolinker.truncate.TruncateSmart(text, this.props.truncate, this.props.truncateChars) : text;

    return (
      <Text
        key={index}
        style={[styles.link, this.props.linkStyle]}
        onPress={() => { this._onPress(match) }}>
          {truncated}
      </Text>
    );
  }

  render() {
    // Destructure props
    /* eslint-disable no-unused-vars */
    /* https://github.com/babel/babel-eslint/issues/95 */
    let {
      email,
      hashtag,
      linkStyle,
      onPress,
      phone,
      renderLink,
      stripPrefix,
      text,
      truncate,
      truncateChars,
      twitter,
      url,
      ...other,
    } = this.props;

    // Creates a token with a random UID that should not be guessable or
    // conflict with other parts of the string.
    let uid = Math.floor(Math.random() * 0x10000000000).toString(16);
    let tokenRegexp = new RegExp(`(@__ELEMENT-${uid}-\\d+__@)`, 'g');

    let generateToken = (() => {
      let counter = 0;
      return () => `@__ELEMENT-${uid}-${counter++}__@`;
    })();

    let matches = {};

    try {
      text = Autolinker.link(text || '', {
        email,
        hashtag,
        phone,
        twitter,
        urls: url,
        stripPrefix,
        replaceFn: (autolinker, match) => {
          let token = generateToken();

          matches[token] = match;

          return token;
        },
      });
    } catch (e) {
      console.warn(e);

      return null;
    }

    let nodes = text
      .split(tokenRegexp)
      .filter((part) => !!part)
      .map((part, index) => {
        let match = matches[part];

        if (!match) return part;

        switch (match.getType()) {
          case 'email':
          case 'hashtag':
          case 'phone':
          case 'twitter':
          case 'url':
            return (renderLink) ? renderLink(match.getAnchorText(), match, index) : this.renderLink(match.getAnchorText(), match, index);
          default:
            return part;
        }
      });

    return createElement(Text, {ref: (component) => { this._root = component; }, ...other}, ...nodes);
  }
}

const styles = StyleSheet.create({
  link: {
    color: '#0E7AFE',
  },
});

Autolink.defaultProps = {
  email: true,
  hashtag: false,
  phone: true,
  stripPrefix: true,
  truncate: 32,
  truncateChars: '..',
  twitter: false,
  url: true,
};

Autolink.propTypes = {
  email: PropTypes.bool,
  hashtag: PropTypes.oneOf([false, 'instagram', 'twitter']),
  linkStyle: Text.propTypes.style,
  numberOfLines: PropTypes.number,
  onPress: PropTypes.func,
  phone: PropTypes.bool,
  renderLink: PropTypes.func,
  stripPrefix: PropTypes.bool,
  text: PropTypes.string.isRequired,
  truncate: PropTypes.number,
  truncateChars: PropTypes.string,
  twitter: PropTypes.bool,
  url: PropTypes.bool,
};
