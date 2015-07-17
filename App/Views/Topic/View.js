'use strict';
var React = require('react-native');

var {
	Text,
	View,
	Image,
	ListView,
	ScrollView,
	ActivityIndicatorIOS
} = React;

var Style = require('./StyleSheet');
var Api = require('../../Network/API');

var CommentCell = require('./CommentCell');
var timeago = require('./timeago');

var CACHE = [];

var TopicView = React.createClass({
	getInitialState: function(){
		return {
			commentsDataSource: new ListView.DataSource({
				rowHasChanged: (r1, r2) => r1 !== r2
			}),
			loaded: false,
			comment_loaded: false,
			currentPage: 0
		};
	},
	componentDidMount: function(){
		this.fetchData();
		this.fetchCommentData(1);
	},
	cache: function(items){
          for (var i in items) {
            CACHE.push(items[i]);
          }
	},

	fetchData: function(){
		fetch(Api.Topic(this.props.data.id))
		.then((response) => {
			// console.log(response);
			return response.json();
		})
		.then((responseData) => {
			this.setState({
				topic: responseData.topic,
				loaded: true,
				comment_loaded: this.state.comment_loaded
			});
		})
		.done();
	},
	fetchCommentData: function(page){
		var limit = 50;
		var offset = (page-1)*limit;

		fetch(Api.Comments(this.props.data.id, offset, limit))
		.then((response) => {
			// console.log(response);
			return response.json();
		})
		.then((responseData) => {
			this.cache(responseData.replies);

			this.setState({
				topic: this.state.topic,
				loaded: this.state.loaded,
				comment_loaded: true,
				commentsDataSource: this.state.commentsDataSource.cloneWithRows(CACHE),
				currentPage: this.state.currentPage+1,
			});
		})
		.done();
	},

	render: function(){
		return (
			<View style={{flex:1, marginTop: 65}}>
				{this.renderTopicHeader()}
				{this.renderLoaded()}
			</View>
			);
	},

	renderLoaded: function(){
		if(!this.state.comment_loaded || !this.state.loaded){
			return (
				<View style={{height: 20, flex:1,justifyContent: 'center',alignItems: 'center'}}>
					<ActivityIndicatorIOS color="#356DD0" style={{marginVertical: 30,marginBottom: 30}} />
				</View>
			);
		}

		return (
			<ListView renderHeader={this.renderTopicContent}
			dataSource={this.state.commentsDataSource}
			renderRow={this.renderComments}
			renderFooter={this.renderFooter}
			onEndReached={this.onEndReached}
	        automaticallyAdjustContentInsets={false}
	        showsVerticalScrollIndicator={false} 
			style={Style.TopicList} />
		);
	},

	renderFooter: function() {
	    if(this.state.comment_loaded){
	    	<View style={{marginVertical: 30}} ><Text>...</Text></View>
	    }
	    return <ActivityIndicatorIOS color="#356DD0"  style={{marginVertical: 30,marginBottom: 30}} />;
	},

	onEndReached: function() {
	    if(!this.state.comment_loaded) {
	      return;
	    }
	    return this.fetchCommentData(this.state.currentPage + 1);
	},

	renderTopicContent: function(){
		return (
			<View style={Style.container}>
				<View style={[Style.contentWrapper, {marginTop: -5}]}>
					<Text style={Style.content}>
						{this.state.topic.body}
					</Text>
				</View>
			</View>
		);
	},

	renderTopicHeader: function(){
		var data = this.props.data;
		return (
			<View style={Style.header}>
				<View style={{flex:1}}>
					<Text style={Style.title}>
						{data.title}
					</Text>
					{this.renderInfo()}
				</View>
				<Image style={Style.avatar} 
						source={{
							uri: data.user.avatar_url
					}}/>
			</View>
		);
	},

	renderInfo: function(){
		var data = this.props.data;
		if(data.replied_at){
			return (
						<Text style={Style.info}>
							<Text style={Style.node_name}>{data.node_name}</Text> • 
							<Text style={Style.user}>{data.user.login}</Text> • 
							<Text>最后由</Text>
							<Text style={Style.user}>{data.node_name}</Text> 
							<Text style={Style.time}>于{timeago(data.replied_at)}发布</Text>
						</Text>
						);
		}
		return (
						<Text style={Style.info}>
							<Text style={Style.node_name}>{data.node_name}</Text> • 
							<Text style={Style.user}>{data.user.login}</Text> • 
							<Text style={Style.time}>于{timeago(data.replied_at)}发布</Text>
						</Text>
			);
	},

	renderComments: function(data){
		return (
			<CommentCell data={data} />
		);
	},

});

module.exports = TopicView;
