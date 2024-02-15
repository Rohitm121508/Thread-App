import { AddIcon } from "@chakra-ui/icons";
import {
  Button,
  CloseButton,
  Flex,
  FormControl,
  Image,
  Input,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import usePreviewImg from "../hooks/usePreviewImg";
import { BsFillImageFill } from "react-icons/bs";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { useParams } from "react-router-dom";

const MAX_CHAR = 500

const CreatePost = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [postText, setPostText] = useState("");
  const [loading,setLoading] = useState(false)
  const [remainingChar,setRemainingChar] = useState(MAX_CHAR)
  const [posts,setPosts] = useRecoilState(postsAtom)

  const fileRef = useRef(null)
  const {handleImgChange,imgUrl,setImgUrl} = usePreviewImg()
  const user = useRecoilValue(userAtom)
  const showToast = useShowToast()
  const {username} = useParams()

  const handleCreatePost = async()=>{
    setLoading(true)
   try {
     const res =await fetch('/api/posts/create',{
         method:'POST',
         headers:{
             'Content-Type':'application/json'
         },
         body:JSON.stringify({postedBy:user._id,text:postText,img:imgUrl})
     })
     const data = await res.json()
     if(data.error){
        showToast("Error",data.error,"error")
        return
     }
     showToast("Success","Post Created Successfully","success")
     if(username==user.username){

       setPosts([data,...posts])
     }
     onClose()
     setPostText("")
     setImgUrl("")
   } catch (error) {
    showToast("Error",error,"error")
   }finally{
    setLoading(false)
   }

  }

  const handleTextChange = (e) => {
     const inputText = e.target.value

     if(inputText.length > MAX_CHAR){
        const truncatedText = inputText.slice(0,MAX_CHAR)
        setPostText(truncatedText)
        setRemainingChar(0)
     }else{
        setPostText(inputText)
        setRemainingChar(MAX_CHAR-inputText.length)
     }
  };
  return (
    <>
      <Button
        position={`fixed`}
        bottom={10}
        right={5}
        bg={useColorModeValue("gray.300", "gray.dark")}
        onClick={onOpen}
        isLoading={loading}
        size={{ base: "sm", sm: "md" }}
      >
       <AddIcon />
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <Textarea
                placeholder="Post Content goes here"
                onChange={handleTextChange}
                value={postText}
              />
              <Text fontSize={`xs`} fontWeight={`bold`} textAlign={`right`} m={1} color={'gray.800'}> 
                {remainingChar}/{MAX_CHAR}
              </Text>
              <Input type="file"
              hidden
              ref={fileRef}
              onChange={handleImgChange}/>
              <BsFillImageFill
              style={{ marginLeft: "5px", cursor: "pointer" }}
              size={16}
              onClick={()=> fileRef.current.click()}/>
            </FormControl>
            {imgUrl &&(
                <Flex mt={5} position="relative" w={'full'}>
                  <Image src={imgUrl} alt="Selected Img"/>
                  <CloseButton
                   onClick={()=>{
                    setImgUrl('')
                   }}
                   bg={'gray.800'}
                   position={'absolute'}
                   top={2}
                   right={2}
                  />
                </Flex>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleCreatePost}>
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreatePost;
