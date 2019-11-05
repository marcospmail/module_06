import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from '../../services/api';

import { Container, Header, Name, Avatar, Bio, Stars, Starred, OwnerAvatar, Info, Title, Author, LoadingMore, Loading } from './styles';

export default class User extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('user').name
  });

  static propTypes = {
    navigation: PropTypes.shape({
      getParam: PropTypes.func
    }).isRequired
  }

  state = {
    stars: [],
    refreshingList: false,
    loadingFirstTime: true,
    loadingMore: false,
    page: 1
  }

  async componentDidMount() {
    this.loadFirstPage();
  }

  getUser = () => {
    const { navigation } = this.props;
    return navigation.getParam('user');
  }

  load = page => {
    const user = this.getUser();
    return api.get(`/users/${user.login}/starred?page=${page}`);
  }

  loadFirstPage = async () => {
    this.setState({ page: 1 });

    const response = await this.load(1);

    this.setState({ stars: response.data, loadingFirstTime: false });
  }

  loadMore = async () => {
    this.setState({ loadingMore: true });

    const { page } = this.state;
    const newPage = page + 1;

    const response = await this.load(newPage);

    this.setState({ stars: [...this.state.stars, ...response.data], loadingMore: false, page: newPage });
  }

  refreshList = async () => {
    this.setState({ refreshingList: true, page: 1 });

    const response = await this.load(1);

    this.setState({ stars: response.data, refreshingList: false });
  }

  handleNavigate = repository => {
    const { navigation } = this.props;
    navigation.navigate('Repository', { repository });
  }

  onEndReached = async ({ distanceFromEnd }) => {
    if (this.momentumScrolling) {
      await this.loadMore();
      this.momentumScrolling = false;
    }
  }

  render() {
    const { navigation } = this.props;
    const { stars, refreshingList, loadingFirstTime, loadingMore } = this.state;

    const user = navigation.getParam('user');

    return (
      <Container>
        <Header>
          <Avatar source={{ uri: user.avatar }} />
          <Name>{user.name}</Name>
          <Bio>{user.bio}</Bio>
        </Header>

        {loadingFirstTime ? (
          <Loading size={50} />
        ) : (<>
          <Stars
            onRefresh={this.refreshList}
            refreshing={refreshingList}
            data={stars}
            keyExtractor={star => String(star.id)}
            onEndReachedThreshold={0.2}
            onEndReached={!loadingMore && this.onEndReached}
            onMomentumScrollBegin={() => { this.momentumScrolling = true }}
            renderItem={({ item }) => {
              const lastItem = item.id === stars[stars.length - 1].id;

              return (
                <>
                  <Starred onPress={() => this.handleNavigate(item)} lastItem={lastItem} >
                    <OwnerAvatar source={{ uri: item.owner.avatar_url }} />
                    <Info>
                      <Title>{item.name}</Title>
                      <Author>{item.owner.login}</Author>
                    </Info>
                  </Starred>

                  {this.momentumScrolling && lastItem && <LoadingMore size={30} />}

                </>
              )
            }}
          />
        </>
          )}

      </Container>
    )
  }
}

