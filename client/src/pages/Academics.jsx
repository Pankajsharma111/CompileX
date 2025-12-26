import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from '../components/Card'
import { assets } from "../assets/assets";

const Home = () => {
        const branches = [
        { fullName: "Computer Science and Engineering", shortName: "cse" ,link : assets.cse1},
        { fullName: "Electronics and Communication Engineering", shortName: "ec" ,link : assets.cse1},
        { fullName: "Electrical Engineering", shortName: "ee" ,link : assets.cse1},
        { fullName: "Civil Engineering", shortName: "ce" ,link : assets.cse1},
        { fullName: "Mechanical Engineering", shortName: "me" ,link : assets.cse1},
        { fullName: "Chemical Engineering", shortName: "cm" ,link : assets.cse1}
        ];

  return (
    <>
      <Navbar/>
      <div className='mx-40 my-5 p-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pt-[120px]'>
        {branches.map((branch, index) => (
        <Card key={index} branch={branch} />
      ))}
      </div>
      <Footer/>
    </>
  )
}

export default Home
