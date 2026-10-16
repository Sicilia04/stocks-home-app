// navigation/index.tsx
import {Ionicons} from '@expo/vector-icons';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';

import {HomeScreen} from './screens/app/HomeScreen';
import {MovementScreen} from './screens/app/MovementScreen';
import {MovementsListScreen} from './screens/app/MovementsListScreen';
import {MovementFormScreen, type MovementFormRouteProps} from './screens/app/MovementFormScreen';
import {ProductsScreen} from './screens/app/ProductsScreen';
import {ProductFormScreen, type ProductFormRouteProps} from './screens/app/ProductFormScreen';
import {CategoriesScreen} from './screens/app/CategoriesScreen';
import {CategoryFormScreen, type CategoryFormRouteProps} from './screens/app/CategoryFormScreen';
import ProfileScreen from './screens/app/ProfileScreen';
import {NotFound} from './screens/app/NotFound';
import LoadingScreen from './screens/LoadingScreen';

import {useAuth} from '../context/AuthContext';
import {AuthStackScreen} from './AuthNavigator';

const TAB_ICON_MAP = {
    HomeApp: 'home',
    MovementApp: 'swap-horizontal',
    ProductsApp: 'cube',
    CategoriesApp: 'grid',
    ProfileApp: 'person',
} as const;

type TabIconName = (typeof TAB_ICON_MAP)[keyof typeof TAB_ICON_MAP];

const tabIcon = (name: TabIconName) =>
    ({color, size}: {color: string; size: number}) => (
        <Ionicons name={name} color={color} size={size}/>
    );

// App tabs
type AppTabsParamList = {
    HomeApp: undefined;
    MovementApp: undefined;
    ProductsApp: undefined;
    CategoriesApp: undefined;
    ProfileApp: undefined;
};
export type {AppTabsParamList};
const AppTabs = createBottomTabNavigator<AppTabsParamList>();

function AppTabNavigator() {
    return (
        <AppTabs.Navigator screenOptions={{headerShown: false}}>
            <AppTabs.Screen
                name="HomeApp"
                component={HomeScreen}
                options={{title: 'Home', tabBarIcon: tabIcon(TAB_ICON_MAP.HomeApp)}}
            />
            <AppTabs.Screen
                name="MovementApp"
                component={MovementScreen}
                options={{title: 'Mouvement', tabBarIcon: tabIcon(TAB_ICON_MAP.MovementApp)}}
            />
            <AppTabs.Screen
                name="ProductsApp"
                component={ProductsScreen}
                options={{title: 'Products', tabBarIcon: tabIcon(TAB_ICON_MAP.ProductsApp)}}
            />
            <AppTabs.Screen
                name="CategoriesApp"
                component={CategoriesScreen}
                options={{title: 'Categories', tabBarIcon: tabIcon(TAB_ICON_MAP.CategoriesApp)}}
            />
            <AppTabs.Screen
                name="ProfileApp"
                component={ProfileScreen}
                options={{title: 'Profile', tabBarIcon: tabIcon(TAB_ICON_MAP.ProfileApp)}}
            />
        </AppTabs.Navigator>
    );
}

// App/Auth/Root stacks
type RootStackParamList = {App: undefined; Auth: undefined};
type AppStackParamList = {
    Tabs: {screen: keyof AppTabsParamList};
    NotFound: undefined;
    MovementsList: undefined;
    MovementForm: MovementFormRouteProps;
    ProductForm: ProductFormRouteProps | undefined;
    CategoryForm: CategoryFormRouteProps | undefined;
};

export type {AppStackParamList};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AppStackScreen() {
    return (
        <AppStack.Navigator screenOptions={{headerShown: true, headerStyle: {backgroundColor: '#fff'}, headerTintColor: '#212121'}}>
            <AppStack.Screen name="Tabs" options={{headerShown: false}} component={AppTabNavigator}/>
            <AppStack.Screen name="NotFound" options={{headerShown: false}} component={NotFound}/>
            <AppStack.Screen name="MovementsList" component={MovementsListScreen} options={{title: 'Mouvements'}}/>
            <AppStack.Screen name="MovementForm" component={MovementFormScreen} options={{title: 'Mouvement de stock', presentation: 'modal'}}/>
            <AppStack.Screen name="ProductForm" component={ProductFormScreen} options={({route}) => ({title: route.params?.productId != null ? 'Modifier le produit' : 'Nouveau produit'})}/>
            <AppStack.Screen name="CategoryForm" component={CategoryFormScreen} options={({route}) => ({title: route.params?.categoryId != null ? 'Modifier la catégorie' : 'Nouvelle catégorie'})}/>
        </AppStack.Navigator>
    );
}


export type NavigationProps = Omit<React.ComponentProps<typeof NavigationContainer>, 'children'>;

export function Navigation({theme, linking, onReady}: NavigationProps) {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return <LoadingScreen/>;
    }

    return (
        <NavigationContainer theme={theme} linking={linking} onReady={onReady}>
            <RootStack.Navigator screenOptions={{headerShown: false}}>
                {isAuthenticated ? (
                    <RootStack.Screen name="App" component={AppStackScreen}/>
                ) : (
                    <RootStack.Screen name="Auth" component={AuthStackScreen}/>
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
}
