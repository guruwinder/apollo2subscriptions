const express = require('express');
const { gql, ApolloServer } = require('apollo-server-express');
// const { ApolloServer } = require('apollo-server');
const { RedisPubSub } = require('graphql-redis-subscriptions');
const http = require('http');
const https = require('https');

const app = express();

const pubsub = new RedisPubSub();

const population = [
	{
		name: 'rohan',
		age: 30,
		invitedBy: 'guru'
	},
	{ name: 'guru', age: 29, invitedBy: 'amit' }
];

const typeDefs = gql`
	type Query {
		people(name: String): People
	}
	type People {
		name: String
		age: Int
		referredBy: People
	}
	type Subscription {
		subHello(id: Int): String
	}
`;
const resolvers = {
	Query: {
		people: (root, args) =>
			population.filter(p => p.name === args.name).shift()
	},
	People: {
		referredBy: person =>
			population.filter(p => p.name === person.invitedBy).shift()
	},
	Subscription: {
		subHello: {
			subscribe: (root, args) =>  pubsub.asyncIterator('channel' + args.id)
		}
	}
};

const apollo = new ApolloServer({ typeDefs, resolvers });
apollo.applyMiddleware({app});
let server = http.createServer(app);
apollo.installSubscriptionHandlers(server);
server.listen({port: 5000}, console.log);